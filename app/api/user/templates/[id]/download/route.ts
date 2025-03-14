import { NextResponse, type NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { v2 as cloudinary } from "cloudinary"
import { extractCloudinaryDetails } from "@/lib/cloudinary"

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id
    const templateId = params.id

    // Find the template
    const template = await db.document.findFirst({
      where: {
        id: templateId,
        type: "template",
      },
    })

    if (!template) {
      console.error(`Template not found: ${templateId}`)
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    // Check if user has access to this template
    // Using Document model with type "access_template" instead of TemplateAccess
    const access = await db.document.findFirst({
      where: {
        type: "access_template",
        name: `access_${templateId}_${userId}`,
      },
    })

    // For free templates or if user has access, allow download
    const isFreeTemplate = template.category.includes("Free") || template.name.includes("Free")

    if (!isFreeTemplate && !access) {
      console.error(`User ${userId} does not have access to template ${templateId}`)
      return NextResponse.json({ error: "You don't have access to this template" }, { status: 403 })
    }

    // Increment usage count (optional)
    // This would need to be implemented based on your specific requirements

    // Get the file URL
    const fileUrl = template.fileUrl
    if (!fileUrl) {
      console.error(`Template ${templateId} has no file URL`)
      return NextResponse.json({ error: "Template file not available" }, { status: 404 })
    }

    console.log(`Attempting to download template: ${templateId}, URL: ${fileUrl}`)

    // Check if it's a Cloudinary URL
    if (fileUrl.includes("cloudinary.com")) {
      try {
        // Extract Cloudinary details
        const { publicId, resourceType, folderPath } = extractCloudinaryDetails(fileUrl)

        if (!publicId) {
          console.error(`Could not extract public ID from URL: ${fileUrl}`)
          return NextResponse.json({
            url: fileUrl,
            filename: template.name.replace(/[^a-z0-9]/gi, "_").toLowerCase() + ".pdf",
          })
        }

        console.log(
          `Extracted Cloudinary details - Public ID: ${publicId}, Resource Type: ${resourceType}, Folder: ${folderPath}`,
        )

        // Try to download with the detected resource type
        try {
          const result = await downloadFromCloudinary(publicId, resourceType as "image" | "raw" | "video")
          if (result) {
            // Create a filename based on the template name
            const filename =
              template.name.replace(/[^a-z0-9]/gi, "_").toLowerCase() +
              "." +
              getExtensionFromResourceType(resourceType, result.format)

            // Return the file directly
            return new NextResponse(result.buffer, {
              headers: {
                "Content-Type": result.contentType,
                "Content-Disposition": `attachment; filename="${filename}"`,
              },
            })
          }
        } catch (error) {
          console.error(`Failed to download with resource type ${resourceType}:`, error)
        }

        // If the first attempt failed, try other resource types
        const resourceTypes = ["raw", "image", "video"] as const
        for (const type of resourceTypes) {
          if (type === resourceType) continue // Skip the one we already tried

          try {
            console.log(`Trying alternative resource type: ${type} for ${publicId}`)
            const result = await downloadFromCloudinary(publicId, type)
            if (result) {
              // Create a filename based on the template name
              const filename =
                template.name.replace(/[^a-z0-9]/gi, "_").toLowerCase() +
                "." +
                getExtensionFromResourceType(type, result.format)

              // Return the file directly
              return new NextResponse(result.buffer, {
                headers: {
                  "Content-Type": result.contentType,
                  "Content-Disposition": `attachment; filename="${filename}"`,
                },
              })
            }
          } catch (error) {
            console.error(`Failed to download with resource type ${type}:`, error)
          }
        }

        // If all direct download attempts failed, return the URL for client-side handling
        console.log(`All Cloudinary download attempts failed, returning URL for client-side handling`)
        return NextResponse.json({
          url: fileUrl,
          filename: template.name.replace(/[^a-z0-9]/gi, "_").toLowerCase() + ".pdf",
        })
      } catch (error) {
        console.error(`Error processing Cloudinary URL:`, error)
        return NextResponse.json({
          url: fileUrl,
          filename: template.name.replace(/[^a-z0-9]/gi, "_").toLowerCase() + ".pdf",
        })
      }
    } else {
      // For non-Cloudinary URLs, return the URL for client-side handling
      console.log(`Non-Cloudinary URL, returning for client-side handling: ${fileUrl}`)
      return NextResponse.json({
        url: fileUrl,
        filename: template.name.replace(/[^a-z0-9]/gi, "_").toLowerCase() + ".pdf",
      })
    }
  } catch (error: any) {
    console.error("Error downloading template:", error)
    return NextResponse.json({ error: error.message || "Failed to download template" }, { status: 500 })
  }
}

async function downloadFromCloudinary(publicId: string, resourceType: "image" | "raw" | "video") {
  try {
    console.log(`Attempting to download from Cloudinary - Public ID: ${publicId}, Resource Type: ${resourceType}`)

    // Generate a signed URL with the admin API
    const url = cloudinary.url(publicId, {
      resource_type: resourceType,
      secure: true,
      sign_url: true,
      type: "authenticated",
    })

    console.log(`Generated signed URL: ${url}`)

    // Fetch the file
    const response = await fetch(url)
    if (!response.ok) {
      console.error(`Cloudinary fetch failed: ${response.status} ${response.statusText}`)
      return null
    }

    // Get the content type and format
    const contentType = response.headers.get("content-type") || "application/octet-stream"
    const format = getFormatFromContentType(contentType)

    // Get the file as a buffer
    const buffer = await response.arrayBuffer()

    return {
      buffer,
      contentType,
      format,
    }
  } catch (error) {
    console.error(`Error downloading from Cloudinary:`, error)
    return null
  }
}

function getFormatFromContentType(contentType: string): string {
  const mapping: Record<string, string> = {
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.ms-excel": "xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "image/jpeg": "jpg",
    "image/png": "png",
    "text/plain": "txt",
  }

  return mapping[contentType] || "pdf"
}

function getExtensionFromResourceType(resourceType: string, format?: string): string {
  if (format) return format

  switch (resourceType) {
    case "image":
      return "jpg"
    case "video":
      return "mp4"
    case "raw":
    default:
      return "pdf"
  }
}

