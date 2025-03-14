import { NextResponse, type NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
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

    // Check if user exists and get their business
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { business: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!user.business) {
      return NextResponse.json({ error: "User does not have an associated business" }, { status: 400 })
    }

    // Extract template metadata
    let templateName = template.name
    let templatePrice = 0
    let templateTier = "Free"

    try {
      const parts = template.name.split("|")
      if (parts && parts.length > 2) {
        templateName = parts[0]
        templatePrice = Number.parseFloat(parts[1]) || 0
        templateTier = parts[2] || "Free"
      }
    } catch (e) {
      console.error("Error parsing template metadata:", e)
    }

    // Check if access already exists by looking for a document with access_template type
    const existingAccess = await prisma.document.findFirst({
      where: {
        businessId: user.business.id,
        type: "access_template",
        name: `access_${templateId}_${userId}`,
      },
    })

    if (existingAccess) {
      return NextResponse.json({
        success: true,
        message: "User already has access to this template",
        access: existingAccess,
      })
    }

    // Create a document to track template access
    const access = await prisma.document.create({
      data: {
        name: `access_${templateId}_${userId}`,
        category: "template_access",
        businessId: user.business.id,
        fileUrl: template.fileUrl,
        type: "access_template",
      },
    })

    // Also create a copy of the template in the user's business documents
    // This makes it easier for the user to find and use the template
    const userTemplate = await prisma.document.create({
      data: {
        name: `${templateName} (Unlocked)`,
        category: template.category,
        businessId: user.business.id,
        fileUrl: template.fileUrl,
        type: "user_template",
      },
    })

    return NextResponse.json({
      success: true,
      message: "Template access granted successfully",
      access,
      userTemplate,
    })
  } catch (error: any) {
    console.error("Error granting template access:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

