import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST() {
  try {
    // Create Posts table
    await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Post" (
      "id" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "authorId" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'pending',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      
      CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
    )
  `)

    // Create Comments table
    await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Comment" (
      "id" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "postId" TEXT NOT NULL,
      "authorId" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      
      CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
    )
  `)

    // Create Likes table
    await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Like" (
      "id" TEXT NOT NULL,
      "postId" TEXT,
      "commentId" TEXT,
      "authorId" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      
      CONSTRAINT "Like_pkey" PRIMARY KEY ("id")
    )
  `)

    // Create Tags table
    await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Tag" (
      "id" TEXT NOT NULL,
      "name" TEXT NOT NULL UNIQUE,
      
      CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
    )
  `)

    // Create PostTag junction table
    await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "PostTag" (
      "id" TEXT NOT NULL,
      "postId" TEXT NOT NULL,
      "tagId" TEXT NOT NULL,
      
      CONSTRAINT "PostTag_pkey" PRIMARY KEY ("id")
    )
  `)

    // Add foreign key constraints
    try {
      await db.$executeRawUnsafe(
        `ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      )
    } catch (e) {
      console.log("Post_authorId_fkey constraint may already exist")
    }

    try {
      await db.$executeRawUnsafe(
        `ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      )
    } catch (e) {
      console.log("Comment_postId_fkey constraint may already exist")
    }

    try {
      await db.$executeRawUnsafe(
        `ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      )
    } catch (e) {
      console.log("Comment_authorId_fkey constraint may already exist")
    }

    try {
      await db.$executeRawUnsafe(
        `ALTER TABLE "Like" ADD CONSTRAINT "Like_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      )
    } catch (e) {
      console.log("Like_postId_fkey constraint may already exist")
    }

    try {
      await db.$executeRawUnsafe(
        `ALTER TABLE "Like" ADD CONSTRAINT "Like_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      )
    } catch (e) {
      console.log("Like_commentId_fkey constraint may already exist")
    }

    try {
      await db.$executeRawUnsafe(
        `ALTER TABLE "Like" ADD CONSTRAINT "Like_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      )
    } catch (e) {
      console.log("Like_authorId_fkey constraint may already exist")
    }

    try {
      await db.$executeRawUnsafe(
        `ALTER TABLE "PostTag" ADD CONSTRAINT "PostTag_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      )
    } catch (e) {
      console.log("PostTag_postId_fkey constraint may already exist")
    }

    try {
      await db.$executeRawUnsafe(
        `ALTER TABLE "PostTag" ADD CONSTRAINT "PostTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      )
    } catch (e) {
      console.log("PostTag_tagId_fkey constraint may already exist")
    }

    return NextResponse.json({
      success: true,
      message: "Community tables created successfully",
    })
  } catch (error) {
    console.error("Error creating community tables:", error)
    return NextResponse.json({ success: false, error: "Failed to create community tables" }, { status: 500 })
  }
}

