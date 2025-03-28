import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { db } from "@/lib/db"
import { Role } from "@/lib/enums"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find the user and check if they are an admin
    const user = await db.user.findFirst({
      where: { email: session.user.email },
      select: { id: true, role: true },
    })

    if (!user || (user.role !== Role.ADMIN && user.role !== Role.SUPPORT)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the request body for notes
    const body = await req.json()

    // Update the personal details status to approved
    const personalDetails = await db.personalDetails.update({
      where: { id },
      data: {
        status: "approved",
        adminNotes: body.notes || null,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ personalDetails })
  } catch (error) {
    console.error("Error approving personal details:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

