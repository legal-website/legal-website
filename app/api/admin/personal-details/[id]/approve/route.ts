import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { db } from "@/lib/db"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin or support
    const user = await db.user.findFirst({
      where: { email: session.user.email },
      select: { role: true },
    })

    if (!user || (user.role !== "ADMIN" && user.role !== "SUPPORT")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = params
    const body = await req.json()
    const { adminNotes } = body

    // Update personal details
    const personalDetails = await db.personalDetails.update({
      where: { id },
      data: {
        status: "approved",
        adminNotes,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ personalDetails })
  } catch (error) {
    console.error("Error approving personal details:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

