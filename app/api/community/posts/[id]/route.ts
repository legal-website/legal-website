import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { Role } from "@/lib/enums"
import { v4 as uuidv4 } from "uuid"

// Add GET function to handle fetching post details
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const postId = params.id

    // Get the post with author, tags, and counts
    const postResult = await db.$queryRawUnsafe(
      `
      SELECT 
        p.*,
        u.id as authorId,
        u.name as authorName,
        u.image as authorImage,
        (SELECT COUNT(*) FROM "Like" WHERE postId = p.id) as likeCount,
        (SELECT COUNT(*) FROM "Comment" WHERE postId = p.id) as commentCount
      FROM "Post" p
      LEFT JOIN "User" u ON p.authorId = u.id
      WHERE p.id = ?
    `,
      postId,
    )

    if (!postResult || postResult.length === 0) {
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 })
    }

    const post = postResult[0]

    // Get tags for the post
    const tagsResult = await db.$queryRawUnsafe(
      `
      SELECT t.id, t.name
      FROM "Tag" t
      JOIN "PostTag" pt ON t.id = pt.tagId
      WHERE pt.postId = ?
    `,
      postId,
    )

    // Check if current user has liked the post
    const session = await getServerSession(authOptions)
    let isLiked = false

    if (session?.user) {
      const likeResult = await db.$queryRawUnsafe(
        `
        SELECT * FROM "Like"
        WHERE postId = ? AND authorId = ?
      `,
        postId,
        (session.user as any).id,
      )
      isLiked = likeResult && likeResult.length > 0
    }

    // Format the post for response
    const formattedPost = {
      id: post.id,
      title: post.title,
      content: post.content,
      author: {
        id: post.authorId || "",
        name: post.authorName || "Unknown",
        avatar: post.authorImage || `/placeholder.svg?height=40&width=40`,
      },
      date: post.createdAt,
      likes: Number.parseInt(post.likeCount) || 0,
      comments: Number.parseInt(post.commentCount) || 0,
      isLiked,
      tags: tagsResult || [],
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

// Update the PATCH function to handle both sets of status values
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const postId = params.id
    const body = await request.json()
    let { title, content, status, tags } = body

    // Define valid status values based on what's actually in the database
    const VALID_STATUSES = {
      PENDING: "pending",
      PUBLISHED: "published", // In database
      DRAFT: "draft", // In database
      // For backward compatibility with Prisma schema
      APPROVED: "approved", // In Prisma schema
      REJECTED: "rejected", // In Prisma schema
    }

    // Map status if needed for backward compatibility
    if (status === VALID_STATUSES.APPROVED) status = VALID_STATUSES.PUBLISHED
    if (status === VALID_STATUSES.REJECTED) status = VALID_STATUSES.DRAFT

    // Ensure status is one of the valid values
    if (status && !Object.values(VALID_STATUSES).includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status. Must be one of: ${Object.values(VALID_STATUSES).join(", ")}`,
        },
        { status: 400 },
      )
    }

    // Get the existing post
    const existingPostResult = await db.$queryRawUnsafe(
      `
    SELECT * FROM Post WHERE id = ?
  `,
      postId,
    )

    if (!existingPostResult || existingPostResult.length === 0) {
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 })
    }

    const existingPost = existingPostResult[0]

    // Check if user is authorized to update this post
    const isAdmin = (session.user as any).role === Role.ADMIN
    const isAuthor = existingPost.authorId === (session.user as any).id

    if (!isAdmin && !isAuthor) {
      return NextResponse.json({ success: false, error: "Unauthorized to update this post" }, { status: 403 })
    }

    // Only admins can change status
    const updatedStatus = isAdmin && status ? status : existingPost.status
    const now = new Date().toISOString()

    // Update the post
    await db.$executeRawUnsafe(
      `
    UPDATE Post
    SET 
      title = ?,
      content = ?,
      status = ?,
      updatedAt = ?
    WHERE id = ?
  `,
      title || existingPost.title,
      content || existingPost.content,
      updatedStatus,
      now,
      postId,
    )

    // Update tags if provided
    if (tags && Array.isArray(tags)) {
      // Remove existing tags
      await db.$executeRawUnsafe(
        `
      DELETE FROM PostTag WHERE postId = ?
    `,
        postId,
      )

      // Add new tags
      for (const tagName of tags) {
        // Find or create the tag
        const tagResult = await db.$queryRawUnsafe(
          `
        SELECT * FROM Tag WHERE name = ?
      `,
          tagName,
        )

        let tagId
        if (!tagResult || tagResult.length === 0) {
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
          tagId = tagResult[0].id
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
      message: "Post updated successfully",
      post: {
        id: postId,
        title: title || existingPost.title,
        content: content || existingPost.content,
        status: updatedStatus,
        updatedAt: now,
      },
    })
  } catch (error) {
    console.error("Error updating post:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

