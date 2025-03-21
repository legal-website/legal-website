import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    // Get recent posts (as "post" activities)
    const recentPosts = await db.$queryRawUnsafe(`
      SELECT 
        p.id, 
        p.title, 
        p.createdAt, 
        u.id as userId, 
        u.name as userName, 
        u.image as userImage
      FROM Post p
      JOIN User u ON p.authorId = u.id
      ORDER BY p.createdAt DESC
      LIMIT 5
    `)

    // Get recent comments (as "comment" activities)
    const recentComments = await db.$queryRawUnsafe(`
      SELECT 
        c.id, 
        c.content, 
        c.createdAt, 
        p.id as postId, 
        p.title as postTitle,
        u.id as userId, 
        u.name as userName, 
        u.image as userImage
      FROM Comment c
      JOIN Post p ON c.postId = p.id
      JOIN User u ON c.authorId = u.id
      ORDER BY c.createdAt DESC
      LIMIT 5
    `)

    // Get recent likes (as "like" activities)
    const recentLikes = await db.$queryRawUnsafe(`
      SELECT 
        l.id, 
        l.createdAt, 
        p.id as postId, 
        p.title as postTitle,
        u.id as userId, 
        u.name as userName, 
        u.image as userImage
      FROM \`Like\` l
      JOIN Post p ON l.postId = p.id
      JOIN User u ON l.authorId = u.id
      WHERE l.postId IS NOT NULL
      ORDER BY l.createdAt DESC
      LIMIT 5
    `)

    // Format activities and ensure we only return the 10 most recent
    const formatActivities = () => {
      const activities = [
        ...recentPosts.map((post: any) => ({
          id: `post-${post.id}`,
          type: "post",
          user: {
            id: post.userId,
            name: post.userName,
            avatar: post.userImage || "/placeholder.svg?height=40&width=40",
          },
          content: `created a new post "${post.title}"`,
          date: post.createdAt,
        })),
        ...recentComments.map((comment: any) => ({
          id: `comment-${comment.id}`,
          type: "comment",
          user: {
            id: comment.userId,
            name: comment.userName,
            avatar: comment.userImage || "/placeholder.svg?height=40&width=40",
          },
          content: `commented on "${comment.postTitle}"`,
          target: comment.postTitle,
          date: comment.createdAt,
        })),
        ...recentLikes.map((like: any) => ({
          id: `like-${like.id}`,
          type: "like",
          user: {
            id: like.userId,
            name: like.userName,
            avatar: like.userImage || "/placeholder.svg?height=40&width=40",
          },
          content: `liked "${like.postTitle}"`,
          target: like.postTitle,
          date: like.createdAt,
        })),
      ]

      // Sort by date (newest first) and limit to 10 items
      return activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)
    }

    return NextResponse.json({
      success: true,
      activities: formatActivities(),
    })
  } catch (error) {
    console.error("Error fetching recent activities:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

