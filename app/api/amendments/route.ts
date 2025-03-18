import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { uploadToCloudinary } from "@/lib/cloudinary-no-types"
import type { PrismaClient } from "@prisma/client"

// Use type assertion to help TypeScript recognize our models
const prisma = db as PrismaClient & {
  amendment: any
  amendmentStatusHistory: any
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const formData = await req.formData()
    const type = formData.get("type") as string
    const details = formData.get("details") as string
    const document = formData.get("document") as File | null

    if (!type || !details) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    let documentUrl = null
    if (document) {
      documentUrl = await uploadToCloudinary(document)
    }

    // Use the prisma variable with type assertion
    const amendment = await prisma.amendment.create({
      data: {
        userId: session.user.id as string,
        type,
        details,
        documentUrl,
        status: "pending",
      },
    })

    // Create initial status history entry
    await prisma.amendmentStatusHistory.create({
      data: {
        amendmentId: amendment.id,
        status: "pending",
        notes: "Amendment submitted",
      },
    })

    return NextResponse.json({ amendment })
  } catch (error) {
    console.error("[AMENDMENTS_POST]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")

    const where = {
      userId: session.user.id as string,
      ...(status && status !== "all" ? { status } : {}),
    }

    // Use the prisma variable with type assertion
    const amendments = await prisma.amendment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        statusHistory: {
          orderBy: { createdAt: "desc" },
        },
      },
    })

    return NextResponse.json({ amendments })
  } catch (error) {
    console.error("[AMENDMENTS_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

