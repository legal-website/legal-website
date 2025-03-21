import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    // Check if user is admin
    const session = await getServerSession(authOptions)
    const isAdmin = session?.user && (session.user as any).role === "ADMIN"

    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

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

    // Update the activities API to ensure we only return the 10 most recent activities
    // Modify the formatActivities function to properly sort and limit activities

    // Update the formatActivities function to ensure proper sorting and limiting
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
          content: `Created a new post "${post.title}"`,
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
          content: `Commented on "${comment.postTitle}"`,
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
          content: `Liked "${like.postTitle}"`,
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

