import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status") || "pending"
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "15")
    const skip = (page - 1) * limit

    // Get total count for pagination
    const totalItems = await prisma.personalDetails.count({
      where: {
        status: status,
      },
    })

    // Get personal details with pagination
    const personalDetails = await prisma.personalDetails.findMany({
      where: {
        status: status,
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
        members: true, // Include members data
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    })

    // Calculate total pages
    const totalPages = Math.ceil(totalItems / limit)

    return NextResponse.json({
      personalDetails,
      totalItems,
      totalPages,
      currentPage: page,
    })
  } catch (error) {
    console.error("Error fetching personal details:", error)
    return NextResponse.json({ error: "Failed to fetch personal details" }, { status: 500 })
  }
}

// Keep existing route handlers (POST, etc.) if they exist

