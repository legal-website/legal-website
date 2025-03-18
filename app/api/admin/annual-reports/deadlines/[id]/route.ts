import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { UserRole } from "@/lib/db/schema"

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()

    // Update the deadline
    const deadline = await db.annualReportDeadline.update({
      where: {
        id: params.id,
      },
      data: {
        userId: data.userId,
        title: data.title,
        description: data.description,
        dueDate: new Date(data.dueDate),
        fee: data.fee,
        lateFee: data.lateFee,
      },
    })

    return NextResponse.json({ deadline })
  } catch (error) {
    console.error("Error updating deadline:", error)
    return NextResponse.json({ error: "Failed to update deadline" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete the deadline
    await db.annualReportDeadline.delete({
      where: {
        id: params.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting deadline:", error)
    return NextResponse.json({ error: "Failed to delete deadline" }, { status: 500 })
  }
}

