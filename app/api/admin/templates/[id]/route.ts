import { NextResponse, type NextRequest } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// GET - Fetch a specific template
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const templateId = params.id

    // Get the document that represents the template
    const template = await db.document.findUnique({
      where: {
        id: templateId,
        category: "template_master",
      },
    })

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    return NextResponse.json({ template })
  } catch (error: any) {
    console.error("Error fetching template:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update a template
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const templateId = params.id
    const data = await req.json()

    // Update the document
    const updatedTemplate = await db.document.update({
      where: {
        id: templateId,
        category: "template_master",
      },
      data: {
        name: data.name,
        fileUrl: data.fileUrl,
        type: data.type || "template",
      },
    })

    return NextResponse.json({ template: updatedTemplate })
  } catch (error: any) {
    console.error("Error updating template:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete a template
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const templateId = params.id

    // Delete the document
    await db.document.delete({
      where: { id: templateId },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting template:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

