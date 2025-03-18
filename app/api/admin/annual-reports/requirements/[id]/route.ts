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

    // Update the requirement
    const requirement = await db.filingRequirement.update({
      where: {
        id: params.id,
      },
      data: {
        title: data.title,
        description: data.description,
        details: data.details,
        isActive: data.isActive,
      },
    })

    return NextResponse.json({ requirement })
  } catch (error) {
    console.error("Error updating requirement:", error)
    return NextResponse.json({ error: "Failed to update requirement" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete the requirement
    await db.filingRequirement.delete({
      where: {
        id: params.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting requirement:", error)
    return NextResponse.json({ error: "Failed to delete requirement" }, { status: 500 })
  }
}

