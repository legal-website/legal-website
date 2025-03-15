import { NextResponse, type NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

interface UserWithBusiness {
  id: string
  name: string | null
  email: string | null
  role: string
  business: {
    id: string
    name: string
  } | null
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get query parameter
    const url = new URL(req.url)
    const query = url.searchParams.get("query")

    if (!query || query.length < 3) {
      return NextResponse.json({ users: [] })
    }

    // Search users by email or name
    const users = await prisma.user.findMany({
      where: {
        OR: [{ email: { contains: query } }, { name: { contains: query } }],
        role: { not: "ADMIN" }, // Exclude admin users
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      take: 10, // Limit results
    })

    // Format users
    const formattedUsers = users.map((user: UserWithBusiness) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      business: user.business
        ? {
            id: user.business.id,
            name: user.business.name,
          }
        : null,
    }))

    return NextResponse.json({
      users: formattedUsers,
    })
  } catch (error) {
    console.error("Error searching users:", error)
    return NextResponse.json({ error: "Failed to search users" }, { status: 500 })
  }
}

