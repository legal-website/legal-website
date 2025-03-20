import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Role } from "@/lib/role"
import { v4 as uuidv4 } from "uuid"

// Define valid status values
const VALID_STATUSES = {
  PENDING: "pending",
  PUBLISHED: "published",
  DRAFT: "draft",
}

// Update a post
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const postId = params.id
    const body = await request.json()
    let { title, content, status, tags } = body

    // Map "approved" to "published" and "rejected" to "draft" for backward compatibility
    if (status === "approved") status = VALID_STATUSES.PUBLISHED
    if (status === "rejected") status = VALID_STATUSES.DRAFT

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

// Delete a post
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const postId = params.id

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

    // Check if user is authorized to delete this post
    const isAdmin = (session.user as any).role === Role.ADMIN
    const isAuthor = existingPost.authorId === (session.user as any).id

    if (!isAdmin && !isAuthor) {
      return NextResponse.json({ success: false, error: "Unauthorized to delete this post" }, { status: 403 })
    }

    // Delete the post (cascade will handle related records)
    await db.$executeRawUnsafe(
      `
      DELETE FROM Post WHERE id = ?
    `,
      postId,
    )

    return NextResponse.json({
      success: true,
      message: "Post deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting post:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

