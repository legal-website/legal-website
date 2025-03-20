import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Role } from "@/lib/role"

// Get all posts (with filters)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "approved"
    const tag = searchParams.get("tag")
    const search = searchParams.get("search")
    const sort = searchParams.get("sort") || "latest"
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    // Build the where clause
    const where: any = {}

    // For clients, only show approved posts
    // For admins, allow filtering by status
    const session = await getServerSession(authOptions)
    const isAdmin = session?.user && (session.user as any).role === Role.ADMIN

    if (!isAdmin) {
      where.status = "approved"
    } else if (status !== "all") {
      where.status = status
    }

    // Search in title or content
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ]
    }

    // Filter by tag
    if (tag) {
      where.tags = {
        some: {
          tag: {
            name: tag,
          },
        },
      }
    }

    // Determine sort order
    let orderBy: any = {}
    switch (sort) {
      case "popular":
        orderBy = { likes: { _count: "desc" } }
        break
      case "oldest":
        orderBy = { createdAt: "asc" }
        break
      case "latest":
      default:
        orderBy = { createdAt: "desc" }
    }

    // Get posts with author, tags, like count, and comment count
    const posts = await db.post.findMany({
      where,
      orderBy,
      skip,
      take: limit,
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
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    })

    // Get total count for pagination
    const total = await db.post.count({ where })

    // If user is logged in, check which posts they've liked
    let likedPostIds: string[] = []
    if (session?.user) {
      const likes = await db.like.findMany({
        where: {
          authorId: (session.user as any).id,
          postId: {
            in: posts.map((post) => post.id),
          },
        },
        select: {
          postId: true,
        },
      })
      likedPostIds = likes.map((like) => like.postId).filter(Boolean) as string[]
    }

    // Format posts for response
    const formattedPosts = posts.map((post) => ({
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
      replies: post._count?.comments || 0,
      isLiked: likedPostIds.includes(post.id),
    }))

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
    console.error("Error fetching posts:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch posts" }, { status: 500 })
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
    const isAdmin = (session.user as any).role === Role.ADMIN
    const status = isAdmin ? "approved" : "pending"

    // Create the post
    const post = await db.post.create({
      data: {
        title,
        content,
        status,
        authorId: (session.user as any).id,
      },
    })

    // Process tags if provided
    if (tags && Array.isArray(tags) && tags.length > 0) {
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
            postId: post.id,
            tagId: tag.id,
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      post: {
        id: post.id,
        title: post.title,
        content: post.content,
        status: post.status,
        createdAt: post.createdAt,
      },
    })
  } catch (error) {
    console.error("Error creating post:", error)
    return NextResponse.json({ success: false, error: "Failed to create post" }, { status: 500 })
  }
}

