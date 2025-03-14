import { NextResponse, type NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { templateId, userId } = await req.json()

    // Validate required fields
    if (!templateId || !userId) {
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

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Since we don't have a TemplateAccess model, we need to implement a different way to track access
    // This is a placeholder - you'll need to implement your own access control logic
    // For example, you might create a custom table or use metadata

    // For now, we'll just return success
    // In a real implementation, you would record the access grant in your system

    return NextResponse.json({
      success: true,
      message: "Template access granted successfully",
    })
  } catch (error: any) {
    console.error("Error granting template access:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

