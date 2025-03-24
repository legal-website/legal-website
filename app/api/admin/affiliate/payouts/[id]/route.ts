import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Role } from "@/lib/role"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { status, notes } = await req.json()

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }

    // Update the payout
    const payout = await db.affiliatePayout.update({
      where: { id: params.id },
      data: {
        status,
        adminNotes: notes || undefined,
      },
    })

    // Fetch user data separately
    const user = await db.user.findUnique({
      where: { id: payout.userId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    return NextResponse.json({
      payout: {
        ...payout,
        user,
      },
    })
  } catch (error) {
    console.error("Error updating affiliate payout:", error)
    return NextResponse.json({ error: "Failed to update payout" }, { status: 500 })
  }
}

