import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { v4 as uuidv4 } from "uuid"

// Define valid status values based on what's actually in the database
const VALID_STATUSES = {
  PENDING: "pending",
  PUBLISHED: "published",
  DRAFT: "draft",
}

// Get all posts (with filters)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || VALID_STATUSES.PUBLISHED

    const tag = searchParams.get("tag")
    const search = searchParams.get("search")
    const sort = searchParams.get("sort") || "latest"
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    // For clients, only show published posts
    // For admins, allow filtering by status
    const session = await getServerSession(authOptions)
    const isAdmin = session?.user && (session.user as any).role === "ADMIN"

    // Debug log
    console.log("Session:", session?.user)
    console.log("Is admin:", isAdmin)
    console.log("Status filter:", status)

    // Build the where clause
    let whereClause = ""

    if (!isAdmin) {
      whereClause = `WHERE p.status = '${VALID_STATUSES.PUBLISHED}'`
    } else if (status !== "all") {
      whereClause = `WHERE p.status = '${status}'`
    }

    // Add tag filter if provided
    if (tag && tag !== "all_tags" && tag !== "") {
      const tagFilter = `p.id IN (
      SELECT pt.postId 
      FROM PostTag pt 
      JOIN Tag t ON pt.tagId = t.id 
      WHERE t.name = '${tag}'
    )`

      whereClause = whereClause ? `${whereClause} AND ${tagFilter}` : `WHERE ${tagFilter}`
    }

    // Add search filter if provided
    if (search) {
      const searchFilter = `(p.title LIKE '%${search}%' OR p.content LIKE '%${search}%')`

      whereClause = whereClause ? `${whereClause} AND ${searchFilter}` : `WHERE ${searchFilter}`
    }

    // For client, also allow seeing their own posts regardless of status
    if (!isAdmin && session?.user) {
      const userId = (session.user as any).id
      if (whereClause) {
        whereClause = `(${whereClause}) OR p.authorId = '${userId}'`
      } else {
        whereClause = `WHERE p.authorId = '${userId}'`
      }
    }

    // Debug log
    console.log("Fetching posts with where:", whereClause)
    console.log("Fetching posts with sort:", sort)

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

    console.log("Raw posts query:", rawPostsQuery)
    const rawPosts = await db.$queryRawUnsafe(rawPostsQuery)
    console.log("Raw posts result:", rawPosts)

    // Get total count for pagination
    const totalResult = await db.$queryRawUnsafe(`
    SELECT COUNT(*) as total FROM Post p
    ${whereClause}
  `)
    const total = Number(totalResult[0].total) || 0

    // Get tags for each post
    const posts = []
    for (const rawPost of rawPosts) {
      const postTags = await db.$queryRawUnsafe(
        `
      SELECT t.name
      FROM PostTag pt
      JOIN Tag t ON pt.tagId = t.id
      WHERE pt.postId = ?
    `,
        rawPost.id,
      )

      // If user is logged in, check if they've liked this post
      let isLiked = false
      if (session?.user) {
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
    console.error("Error fetching posts:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
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

