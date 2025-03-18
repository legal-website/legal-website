import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import type { PrismaClient } from "@prisma/client"

// Use type assertion to help TypeScript recognize our models
const prisma = db as PrismaClient & {
  amendment: any
  amendmentStatusHistory: any
  user: any
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")

    const where = status && status !== "all" ? { status } : {}

    const amendments = await prisma.amendment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        statusHistory: {
          orderBy: { createdAt: "desc" },
        },
      },
    })

    // Format the amendments to include user name and email
    const formattedAmendments = amendments.map((amendment) => ({
      ...amendment,
      userName: amendment.user.name || "Unknown",
      userEmail: amendment.user.email,
    }))

    return NextResponse.json({ amendments: formattedAmendments })
  } catch (error) {
    console.error("[ADMIN_AMENDMENTS_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

