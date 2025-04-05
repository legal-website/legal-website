import { NextResponse, type NextRequest } from "next/server"
import { PrismaClient } from '@prisma/client';
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { Role } from "@prisma/client"

export async function GET(req: NextRequest) {
  // Check required environment variables
  if (!process.env.DATABASE_URL || !process.env.NEXTAUTH_SECRET) {
    console.error("Missing required environment variables in admin API")
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
  }

  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if ((session.user as any).role !== Role.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      message: "Admin API is working",
      stats: {
        users: 2543,
        documents: 8942,
        revenue: 42389,
      },
    })
  } catch (error) {
    console.error("Error in admin API route:", error)
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
      },
      { status: 500 },
    )
  }
}

