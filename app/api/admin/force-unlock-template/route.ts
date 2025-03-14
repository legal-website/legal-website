import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get request body
    const body = await req.json()
    const { userId, templateId } = body

    if (!userId || !templateId) {
      return NextResponse.json({ error: "User ID and template ID are required" }, { status: 400 })
    }

    console.log(`Force unlocking template ${templateId} for user ${userId}`)

    // Get user's business ID
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { business: true },
    })

    if (!user || !user.business) {
      return NextResponse.json({ error: "User or business not found" }, { status: 404 })
    }

    const businessId = user.business.id
    console.log(`User's business ID: ${businessId}`)

    // Get the template
    const template = await db.document.findUnique({
      where: { id: templateId },
    })

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    // Check if the user already has this template
    const existingTemplate = await db.document.findFirst({
      where: {
        businessId: businessId,
        name: { contains: `template_${templateId}` },
      },
    })

    if (existingTemplate) {
      return NextResponse.json({
        success: false,
        message: "User already has this template",
      })
    }

    // Create a copy of the template for the user
    const newTemplate = await db.document.create({
      data: {
        name: `template_${template.id}_${template.name}`,
        category: "template",
        type: "purchased_template",
        fileUrl: template.fileUrl,
        businessId: businessId,
      },
    })

    console.log(`Template ${template.id} unlocked for user ${userId}, created document ${newTemplate.id}`)

    return NextResponse.json({
      success: true,
      message: `Template ${template.name} unlocked for user ${user.email}`,
      template: newTemplate,
    })
  } catch (error: any) {
    console.error("Error force unlocking template:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An error occurred while force unlocking template",
      },
      { status: 500 },
    )
  }
}

