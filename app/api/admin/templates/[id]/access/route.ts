import { NextResponse, type NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
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

    // Find all access records for this template
    const accessRecords = await prisma.document.findMany({
      where: {
        type: "access_template",
        name: {
          startsWith: `access_${templateId}_`,
        },
      },
      include: {
        business: {
          include: {
            users: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    })

    // Transform the records to include user information
    const templateAccess = []

    for (const record of accessRecords) {
      // Extract userId from the name (format: access_templateId_userId)
      const nameParts = record.name.split("_")
      const userId = nameParts.length > 2 ? nameParts[2] : null

      if (userId) {
        // Find the user in the business users
        const user = record.business.users.find((u) => u.id === userId)

        if (user) {
          templateAccess.push({
            id: record.id,
            documentId: record.id,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
            },
            businessId: record.businessId,
            businessName: record.business.name,
            grantedAt: record.createdAt,
          })
        }
      }
    }

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

    // Delete the access record
    const deletedAccess = await prisma.document.deleteMany({
      where: {
        type: "access_template",
        name: `access_${templateId}_${userId}`,
      },
    })

    // Also delete any user_template documents created for this template
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { business: true },
    })

    if (user && user.business) {
      // Find and delete user templates
      await prisma.document.deleteMany({
        where: {
          businessId: user.business.id,
          type: "user_template",
          // This is a simplification - in a real app, you might need a more precise way to identify templates
          name: {
            contains: "(Unlocked)",
          },
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: "Template access removed successfully",
      count: deletedAccess.count,
    })
  } catch (error: any) {
    console.error("Error removing template access:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

