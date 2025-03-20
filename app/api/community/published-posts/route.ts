import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// Get only published posts (simplified version for dashboard)
export async function GET(request: Request) {
  try {
    console.log("Published Posts API: Starting request")
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    // Use a very simple query to avoid SQL syntax issues
    const postsQuery = `
    SELECT 
      p.id, p.title, p.content, p.status, p.authorId, p.createdAt, p.updatedAt,
      u.id as userId, u.name as userName, u.image as userImage,
      (SELECT COUNT(*) FROM \`Like\` l WHERE l.postId = p.id) as likeCount,
      (SELECT COUNT(*) FROM Comment c WHERE c.postId = p.id) as commentCount
    FROM Post p
    LEFT JOIN User u ON p.authorId = u.id
    WHERE p.status = 'published'
    ORDER BY p.createdAt DESC
    LIMIT ? OFFSET ?
  `

    console.log("Published Posts API: Executing query")

    let posts
    try {
      posts = await db.$queryRawUnsafe(postsQuery, limit, skip)
      console.log(`Published Posts API: Query successful, found ${posts.length} posts`)
    } catch (queryError) {
      console.error("Published Posts API: Query failed", queryError)
      return NextResponse.json(
        {
          success: false,
          error: `Query failed: ${String(queryError)}`,
        },
        { status: 500 },
      )
    }

    // Get total count for pagination
    let total = 0
    try {
      const totalResult = await db.$queryRawUnsafe(`
      SELECT COUNT(*) as total FROM Post WHERE status = 'published'
    `)
      total = Number(totalResult[0].total) || 0
    } catch (countError) {
      console.error("Published Posts API: Count query failed", countError)
      total = posts.length
    }

    // Get session for checking likes
    const session = await getServerSession(authOptions)
    const userId = session?.user ? (session.user as any).id : null

    // Format posts for response
    const formattedPosts = []
    for (const post of posts) {
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
          post.id,
        )
      } catch (error) {
        console.error(`Error getting tags for post ${post.id}:`, error)
      }

      // Check if user has liked this post
      let isLiked = false
      if (userId) {
        try {
          const likeCheck = await db.$queryRawUnsafe(
            `
          SELECT COUNT(*) as liked
          FROM \`Like\`
          WHERE postId = ? AND authorId = ?
        `,
            post.id,
            userId,
          )
          isLiked = Number(likeCheck[0].liked) > 0
        } catch (error) {
          console.error(`Error checking like for post ${post.id}:`, error)
        }
      }

      formattedPosts.push({
        id: post.id,
        title: post.title,
        content: post.content,
        author: {
          id: post.userId || "",
          name: post.userName || "Unknown",
          avatar: post.userImage || `/placeholder.svg?height=40&width=40`,
        },
        status: post.status,
        date: new Date(post.createdAt).toISOString(),
        tags: postTags.map((tag: any) => tag.name),
        likes: Number(post.likeCount) || 0,
        replies: Number(post.commentCount) || 0,
        isLiked,
        isOwnPost: userId === post.authorId,
      })
    }

    return NextResponse.json({
      success: true,
      posts: formattedPosts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Published Posts API: Unhandled error", error)
    return NextResponse.json(
      {
        success: false,
        error: `Unhandled error: ${String(error)}`,
      },
      { status: 500 },
    )
  }
}

