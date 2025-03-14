import { NextResponse, type NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// GET - Fetch users with access to a template
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const templateId = params.id

    // Check if template exists
    const template = await prisma.document.findUnique({
      where: {
        id: templateId,
        type: "template",
      },
    })

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    // Since we don't have a TemplateAccess model, we need to implement a different way to track access
    // This is a placeholder - you'll need to implement your own access control logic

    // For now, we'll return an empty array
    // In a real implementation, you would query your access control system
    const templateAccess: any[] = []

    return NextResponse.json({ templateAccess })
  } catch (error: any) {
    console.error("Error fetching template access:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Remove user access to a template
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const templateId = params.id
    const { userId } = await req.json()

    // Validate required fields
    if (!userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if template exists
    const template = await prisma.document.findUnique({
      where: {
        id: templateId,
        type: "template",
      },
    })

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    // Since we don't have a TemplateAccess model, we need to implement a different way to track access
    // This is a placeholder - you'll need to implement your own access control logic

    // For now, we'll just return success
    // In a real implementation, you would remove the access record from your system

    return NextResponse.json({
      success: true,
      message: "Template access removed successfully",
    })
  } catch (error: any) {
    console.error("Error removing template access:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

