import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Role } from "@/lib/role"

// Update the GET function to handle possibly undefined values
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const postId = params.id

    // Get the post with author, tags, comments, and likes
    const post = await db.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        comments: {
          orderBy: { createdAt: "desc" },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            _count: {
              select: { likes: true },
            },
          },
        },
        _count: {
          select: { likes: true },
        },
      },
    })

    if (!post) {
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 })
    }

    // Check if current user has liked the post
    const session = await getServerSession(authOptions)
    let isLiked = false
    let likedCommentIds: string[] = []

    if (session?.user) {
      // Check if user liked the post
      const postLike = await db.like.findFirst({
        where: {
          postId: postId,
          authorId: (session.user as any).id,
        },
      })
      isLiked = !!postLike

      // Check which comments the user has liked
      if (post.comments && post.comments.length > 0) {
        const commentLikes = await db.like.findMany({
          where: {
            commentId: {
              in: post.comments.map((comment) => comment.id),
            },
            authorId: (session.user as any).id,
          },
          select: {
            commentId: true,
          },
        })
        likedCommentIds = commentLikes.map((like) => like.commentId).filter(Boolean) as string[]
      }
    }

    // Format the post for response
    const formattedPost = {
      id: post.id,
      title: post.title,
      content: post.content,
      author: {
        id: post.author?.id || "",
        name: post.author?.name || "Unknown",
        avatar: post.author?.image || `/placeholder.svg?height=40&width=40`,
      },
      status: post.status,
      date: post.createdAt.toISOString(),
      tags: post.tags?.map((pt) => pt.tag?.name || "") || [],
      likes: post._count?.likes || 0,
      isLiked,
      comments: (post.comments || []).map((comment) => ({
        id: comment.id,
        content: comment.content,
        author: {
          id: comment.author?.id || "",
          name: comment.author?.name || "Unknown",
          avatar: comment.author?.image || `/placeholder.svg?height=40&width=40`,
        },
        date: comment.createdAt.toISOString(),
        likes: comment._count?.likes || 0,
        isLiked: likedCommentIds.includes(comment.id),
      })),
    }

    return NextResponse.json({
      success: true,
      post: formattedPost,
    })
  } catch (error) {
    console.error("Error fetching post:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch post" }, { status: 500 })
  }
}

// Update a post
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const postId = params.id
    const body = await request.json()
    const { title, content, status, tags } = body

    // Get the existing post
    const existingPost = await db.post.findUnique({
      where: { id: postId },
      include: { tags: true },
    })

    if (!existingPost) {
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 })
    }

    // Check if user is authorized to update this post
    const isAdmin = (session.user as any).role === Role.ADMIN
    const isAuthor = existingPost.authorId === (session.user as any).id

    if (!isAdmin && !isAuthor) {
      return NextResponse.json({ success: false, error: "Unauthorized to update this post" }, { status: 403 })
    }

    // Only admins can change status
    const updatedStatus = isAdmin && status ? status : existingPost.status

    // Update the post
    const updatedPost = await db.post.update({
      where: { id: postId },
      data: {
        title: title || existingPost.title,
        content: content || existingPost.content,
        status: updatedStatus,
      },
    })

    // Update tags if provided
    if (tags && Array.isArray(tags)) {
      // Remove existing tags
      await db.postTag.deleteMany({
        where: { postId },
      })

      // Add new tags
      for (const tagName of tags) {
        // Find or create the tag
        let tag = await db.tag.findUnique({
          where: { name: tagName },
        })

        if (!tag) {
          tag = await db.tag.create({
            data: { name: tagName },
          })
        }

        // Create the post-tag relationship
        await db.postTag.create({
          data: {
            postId,
            tagId: tag.id,
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      post: updatedPost,
    })
  } catch (error) {
    console.error("Error updating post:", error)
    return NextResponse.json({ success: false, error: "Failed to update post" }, { status: 500 })
  }
}

// Delete a post
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const postId = params.id

    // Get the existing post
    const existingPost = await db.post.findUnique({
      where: { id: postId },
    })

    if (!existingPost) {
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 })
    }

    // Check if user is authorized to delete this post
    const isAdmin = (session.user as any).role === Role.ADMIN
    const isAuthor = existingPost.authorId === (session.user as any).id

    if (!isAdmin && !isAuthor) {
      return NextResponse.json({ success: false, error: "Unauthorized to delete this post" }, { status: 403 })
    }

    // Delete the post (cascade will handle related records)
    await db.post.delete({
      where: { id: postId },
    })

    return NextResponse.json({
      success: true,
      message: "Post deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting post:", error)
    return NextResponse.json({ success: false, error: "Failed to delete post" }, { status: 500 })
  }
}

