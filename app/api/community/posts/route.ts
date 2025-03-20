import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { v4 as uuidv4 } from "uuid"

// Define valid status values based on what's actually in the database
const VALID_STATUSES = {
  PENDING: "pending",
  PUBLISHED: "published", // In database
  DRAFT: "draft", // In database
  // For backward compatibility with Prisma schema
  APPROVED: "approved", // In Prisma schema
  REJECTED: "rejected", // In Prisma schema
}

// Status mapping for compatibility
const STATUS_MAPPING = {
  [VALID_STATUSES.APPROVED]: VALID_STATUSES.PUBLISHED,
  [VALID_STATUSES.REJECTED]: VALID_STATUSES.DRAFT,
}

// Get all posts (with filters)
export async function GET(request: Request) {
  try {
    console.log("Posts API: Starting request")
    const { searchParams } = new URL(request.url)
    let status = searchParams.get("status") || "published"

    // Map status if needed for backward compatibility
    if (STATUS_MAPPING[status]) {
      status = STATUS_MAPPING[status]
    }

    const tag = searchParams.get("tag")
    const search = searchParams.get("search")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    console.log(`Posts API: Requested status=${status}, page=${page}, limit=${limit}`)

    // For clients, only show published posts
    // For admins, allow filtering by status
    const session = await getServerSession(authOptions)
    const isAdmin = session?.user && (session.user as any).role === "ADMIN"
    const userId = session?.user ? (session.user as any).id : null

    console.log("Posts API: User session", {
      isAuthenticated: !!session?.user,
      isAdmin,
      userId,
    })

    // Build a simpler query first to test
    try {
      console.log("Posts API: Testing simple query")
      const simpleQuery = `
      SELECT id, title, status 
      FROM Post 
      WHERE status = ?
      LIMIT 5
    `
      const simpleResult = await db.$queryRawUnsafe(simpleQuery, status)
      console.log(`Posts API: Simple query successful, found ${simpleResult.length} posts`)
    } catch (simpleError) {
      console.error("Posts API: Simple query failed", simpleError)
      return NextResponse.json(
        {
          success: false,
          error: `Simple query failed: ${String(simpleError)}`,
        },
        { status: 500 },
      )
    }

    // Build the where conditions as an array of strings
    const whereConditions = []

    // Status condition - for non-admins, only show published posts by default
    if (!isAdmin) {
      whereConditions.push(`p.status = '${status}'`)
    } else if (status !== "all") {
      whereConditions.push(`p.status = '${status}'`)
    }

    // Add tag filter if provided
    if (tag && tag !== "all_tags" && tag !== "") {
      whereConditions.push(`p.id IN (
      SELECT pt.postId 
      FROM PostTag pt 
      JOIN Tag t ON pt.tagId = t.id 
      WHERE t.name = '${tag}'
    )`)
    }

    // Add search filter if provided
    if (search) {
      whereConditions.push(`(p.title LIKE '%${search}%' OR p.content LIKE '%${search}%')`)
    }

    // For client, also allow seeing their own posts regardless of status
    // We'll add this as a separate condition with OR
    let whereClause = ""
    if (whereConditions.length > 0) {
      whereClause = `WHERE ${whereConditions.join(" AND ")}`

      // Add the user's own posts condition with proper parentheses
      if (!isAdmin && userId) {
        whereClause = `WHERE (${whereConditions.join(" AND ")}) OR p.authorId = '${userId}'`
      }
    } else if (!isAdmin && userId) {
      // If no other conditions, just filter by user ID
      whereClause = `WHERE p.authorId = '${userId}'`
    }

    console.log("Posts API: Final where clause", whereClause)

    // Get raw posts from database
    const rawPostsQuery = `
    SELECT 
      p.id, p.title, p.content, p.status, p.authorId, p.createdAt, p.updatedAt,
      u.id as userId, u.name as userName, u.image as userImage,
      COUNT(DISTINCT l.id) as likeCount,
      COUNT(DISTINCT c.id) as commentCount
    FROM Post p
    LEFT JOIN User u ON p.authorId = u.id
    LEFT JOIN \`Like\` l ON l.postId = p.id
    LEFT JOIN Comment c ON c.postId = p.id
    ${whereClause}
    GROUP BY p.id, u.id
    ORDER BY p.createdAt DESC
    LIMIT ${limit} OFFSET ${skip}
  `

    console.log("Posts API: Executing raw posts query", rawPostsQuery)

    let rawPosts
    try {
      rawPosts = await db.$queryRawUnsafe(rawPostsQuery)
      console.log(`Posts API: Raw posts query successful, found ${rawPosts.length} posts`)
    } catch (queryError) {
      console.error("Posts API: Raw posts query failed", queryError)
      return NextResponse.json(
        {
          success: false,
          error: `Raw posts query failed: ${String(queryError)}`,
        },
        { status: 500 },
      )
    }

    // Get total count for pagination
    let total = 0
    try {
      console.log("Posts API: Getting total count")
      const totalQuery = `
      SELECT COUNT(*) as total FROM Post p
      ${whereClause}
    `
      const totalResult = await db.$queryRawUnsafe(totalQuery)
      total = Number(totalResult[0].total) || 0
      console.log(`Posts API: Total count query successful, total=${total}`)
    } catch (countError) {
      console.error("Posts API: Total count query failed", countError)
      // Continue anyway, just set total to the number of posts we found
      total = rawPosts.length
    }

    // Format posts for response
    const posts = []
    try {
      console.log("Posts API: Formatting posts for response")
      for (const rawPost of rawPosts) {
        // Get tags for this post
        let postTags = []
        try {
          postTags = await db.$queryRawUnsafe(
            `
          SELECT t.name
          FROM PostTag pt
          JOIN Tag t ON pt.tagId = t.id
          WHERE pt.postId = ?
        `,
            rawPost.id,
          )
        } catch (tagsError) {
          console.error(`Posts API: Error getting tags for post ${rawPost.id}`, tagsError)
          // Continue anyway, just use empty tags
        }

        // Check if user has liked this post
        let isLiked = false
        if (session?.user) {
          try {
            const likeCheck = await db.$queryRawUnsafe(
              `
            SELECT COUNT(*) as liked
            FROM \`Like\`
            WHERE postId = ? AND authorId = ?
          `,
              rawPost.id,
              (session.user as any).id,
            )
            isLiked = Number(likeCheck[0].liked) > 0
          } catch (likeError) {
            console.error(`Posts API: Error checking like for post ${rawPost.id}`, likeError)
            // Continue anyway, just set isLiked to false
          }
        }

        // Check if this is the user's own post
        const isOwnPost = session?.user && rawPost.authorId === (session.user as any).id

        posts.push({
          id: rawPost.id,
          title: rawPost.title,
          content: rawPost.content,
          author: {
            id: rawPost.userId || "",
            name: rawPost.userName || "Unknown",
            avatar: rawPost.userImage || `/placeholder.svg?height=40&width=40`,
          },
          status: rawPost.status,
          date: new Date(rawPost.createdAt).toISOString(),
          tags: postTags.map((tag: any) => tag.name),
          likes: Number(rawPost.likeCount) || 0,
          replies: Number(rawPost.commentCount) || 0,
          isLiked,
          isOwnPost,
        })
      }
      console.log(`Posts API: Successfully formatted ${posts.length} posts`)
    } catch (formatError) {
      console.error("Posts API: Error formatting posts", formatError)
      return NextResponse.json(
        {
          success: false,
          error: `Error formatting posts: ${String(formatError)}`,
        },
        { status: 500 },
      )
    }

    console.log("Posts API: Request completed successfully")
    return NextResponse.json({
      success: true,
      posts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Posts API: Unhandled error", error)
    return NextResponse.json(
      {
        success: false,
        error: `Unhandled error: ${String(error)}`,
      },
      { status: 500 },
    )
  }
}

// Create a new post
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, content, tags } = body

    if (!title || !content) {
      return NextResponse.json({ success: false, error: "Title and content are required" }, { status: 400 })
    }

    // Determine post status based on user role
    const isAdmin = (session.user as any).role === "ADMIN"
    // If admin, publish directly, otherwise set to pending
    const status = isAdmin ? VALID_STATUSES.PUBLISHED : VALID_STATUSES.PENDING
    const now = new Date().toISOString()
    const postId = uuidv4()

    // Create the post using raw SQL
    await db.$executeRawUnsafe(
      `
      INSERT INTO Post (id, title, content, authorId, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      postId,
      title,
      content,
      (session.user as any).id,
      status,
      now,
      now,
    )

    // Process tags if provided
    if (tags && Array.isArray(tags) && tags.length > 0) {
      for (const tagName of tags) {
        // Find or create the tag
        const tag = await db.$queryRawUnsafe(
          `
          SELECT * FROM Tag WHERE name = ?
        `,
          tagName,
        )

        let tagId
        if (!tag || tag.length === 0) {
          // Create new tag
          tagId = uuidv4()
          await db.$executeRawUnsafe(
            `
            INSERT INTO Tag (id, name)
            VALUES (?, ?)
          `,
            tagId,
            tagName,
          )
        } else {
          tagId = tag[0].id
        }

        // Create the post-tag relationship
        const postTagId = uuidv4()
        await db.$executeRawUnsafe(
          `
          INSERT INTO PostTag (id, postId, tagId)
          VALUES (?, ?, ?)
        `,
          postTagId,
          postId,
          tagId,
        )
      }
    }

    return NextResponse.json({
      success: true,
      post: {
        id: postId,
        title,
        content,
        status,
        createdAt: now,
      },
    })
  } catch (error) {
    console.error("Error creating post:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

