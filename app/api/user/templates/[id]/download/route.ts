import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const templateId = params.id
    const userId = (session.user as any).id

    // Get the user with their business
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { business: true },
    })

    if (!user || !user.business) {
      return NextResponse.json({ error: "User or business not found" }, { status: 404 })
    }

    // Check if the template exists
    const template = await prisma.document.findUnique({
      where: {
        id: templateId,
        type: "template",
      },
    })

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    // Extract template metadata
    let displayName = template.name
    let price = 0
    let isFree = false

    try {
      const parts = template.name.split("|")
      if (parts && parts.length > 1) {
        displayName = parts[0].trim()
        price = Number.parseFloat(parts[1]) || 0
        // Consider it free if price is 0 or if it's explicitly marked as free tier
        isFree = price === 0 || (parts.length > 2 && parts[2].toLowerCase() === "free")
      }
    } catch (e) {
      console.error("Error parsing template metadata:", e)
    }

    // Check if user has access to this template
    const accessRecord = await prisma.document.findFirst({
      where: {
        businessId: user.business.id,
        type: "access_template",
        name: `access_${templateId}_${userId}`,
      },
    })

    // Also check for user_template records
    const userTemplate = await prisma.document.findFirst({
      where: {
        businessId: user.business.id,
        type: "user_template",
        fileUrl: template.fileUrl,
      },
    })

    // For free templates or templates the user has access to
    if (isFree || price === 0 || accessRecord || userTemplate) {
      // Increment usage count if tracking in the name
      try {
        const parts = template.name.split("|")
        if (parts && parts.length > 3) {
          const displayName = parts[0]
          const price = parts[1]
          const tier = parts[2]
          const usageCount = (Number.parseInt(parts[3]) || 0) + 1
          const status = parts[4] || "active"

          // Update the document with incremented usage count
          await prisma.document.update({
            where: { id: templateId },
            data: {
              name: `${displayName}|${price}|${tier}|${usageCount}|${status}`,
            },
          })
        }
      } catch (e) {
        console.error("Error updating template usage count:", e)
      }

      // Get the file extension from the URL
      const fileUrl = template.fileUrl || ""
      let fileExtension = ""

      try {
        // Extract file extension from URL or filename
        if (fileUrl) {
          // Remove query parameters for extension extraction
          const urlWithoutParams = fileUrl.split("?")[0]
          const urlParts = urlWithoutParams.split(".")
          if (urlParts.length > 1) {
            fileExtension = urlParts[urlParts.length - 1].toLowerCase()
          }
        }
      } catch (e) {
        console.error("Error extracting file extension:", e)
      }

      // Return direct file URL and metadata
      return NextResponse.json({
        fileUrl: fileUrl,
        name: displayName,
        originalName: template.name,
        fileExtension: fileExtension || "",
        contentType: getContentType(fileExtension),
      })
    }

    // If the user doesn't have access
    return NextResponse.json({ error: "You don't have access to this template" }, { status: 403 })
  } catch (error) {
    console.error("Error downloading template:", error)
    return NextResponse.json({ error: "Failed to download template" }, { status: 500 })
  }
}

// Helper function to determine content type based on file extension
function getContentType(extension: string): string {
  switch (extension.toLowerCase()) {
    case "pdf":
      return "application/pdf"
    case "doc":
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    case "xls":
    case "xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    case "ppt":
    case "pptx":
      return "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    case "jpg":
    case "jpeg":
      return "image/jpeg"
    case "png":
      return "image/png"
    case "gif":
      return "image/gif"
    case "txt":
      return "text/plain"
    default:
      return "application/octet-stream" // Default binary file type
  }
}

