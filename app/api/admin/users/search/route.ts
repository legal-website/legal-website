import { NextResponse, type NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get query parameter
    const url = new URL(req.url)
    const query = url.searchParams.get("query") || ""

    // Search users by email or name
    const users = await prisma.user.findMany({
      where: {
        OR: [{ email: { contains: query } }, { name: { contains: query } }],
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        business: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      take: 10,
    })

    return NextResponse.json({ users })
  } catch (error: any) {
    console.error("Error searching users:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

