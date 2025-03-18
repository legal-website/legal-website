import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import { uploadToCloudinary } from "@/lib/cloudinary-no-types"

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

    const amendment = await db.amendments.create({
      data: {
        id: crypto.randomUUID(),
        userId: session.user.id,
        type,
        details,
        documentUrl,
        status: "pending",
        updatedAt: new Date(),
      },
    })

    // Create initial status history entry
    await db.amendment_status_history.create({
      data: {
        id: crypto.randomUUID(),
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
      userId: session.user.id,
      ...(status && status !== "all" ? { status } : {}),
    }

    const amendments = await db.amendments.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        amendment_status_history: {
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

