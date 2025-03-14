import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { extractCloudinaryDetails } from "@/lib/cloudinary"

// Define a proper type for the downloadOptions object
// Add this type definition before the GET function:

interface DownloadOptions {
  original: string
  proxy: string
  direct: string
  cloudinaryDirect?: string
  cloudinarySigned?: string
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const templateId = params.id
    const userId = (session.user as any).id

    console.log(`Template download requested: ${templateId} by user ${userId}`)

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

    console.log(`Template found: ${template.name}, fileUrl: ${template.fileUrl}`)

    if (!template.fileUrl) {
      return NextResponse.json({ error: "Template has no associated file" }, { status: 404 })
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

      // Get the file extension and content type from the URL
      const fileUrl = template.fileUrl
      let fileExtension = ""
      let contentType = "application/octet-stream" // Default content type

      try {
        // Extract file extension from URL or filename
        if (fileUrl) {
          // Remove query parameters for extension extraction
          const urlWithoutParams = fileUrl.split("?")[0]
          const urlParts = urlWithoutParams.split(".")
          if (urlParts.length > 1) {
            fileExtension = urlParts[urlParts.length - 1].toLowerCase()
            contentType = getContentType(fileExtension)
          }
        }
      } catch (e) {
        console.error("Error extracting file extension:", e)
      }

      // Prepare multiple download options
      const downloadOptions: DownloadOptions = {
        // Option 1: Original URL
        original: fileUrl,

        // Option 2: Proxy download
        proxy: `/api/proxy-download?url=${encodeURIComponent(fileUrl)}&contentType=${encodeURIComponent(contentType)}&templateId=${templateId}&filename=${encodeURIComponent(displayName + (fileExtension ? `.${fileExtension}` : ""))}`,

        // Option 3: Direct download
        direct: `/api/direct-download?documentId=${templateId}&filename=${encodeURIComponent(displayName + (fileExtension ? `.${fileExtension}` : ""))}`,
      }

      // Option 4: If it's a Cloudinary URL, add direct attachment URL
      if (fileUrl.includes("cloudinary.com")) {
        try {
          // Try direct attachment URL
          downloadOptions.cloudinaryDirect = fileUrl.replace("/upload/", "/upload/fl_attachment/")

          // Try signed URL
          const { publicId, resourceType } = extractCloudinaryDetails(fileUrl)
          if (publicId) {
            downloadOptions.cloudinarySigned = cloudinarySignedUrl(publicId, resourceType)
          }
        } catch (e) {
          console.error("Error creating Cloudinary URLs:", e)
        }
      }

      console.log(
        `Returning template download info: ${displayName}, extension: ${fileExtension}, contentType: ${contentType}`,
      )

      // Return all download options and metadata
      return NextResponse.json({
        fileUrl: fileUrl, // Original URL for backward compatibility
        name: displayName,
        originalName: template.name,
        fileExtension: fileExtension || "",
        contentType: contentType,
        success: true,
        downloadOptions: downloadOptions,
        // Recommended download method
        recommendedUrl: downloadOptions.proxy,
      })
    }

    // If the user doesn't have access
    return NextResponse.json({ error: "You don't have access to this template" }, { status: 403 })
  } catch (error) {
    console.error("Error downloading template:", error)
    return NextResponse.json(
      {
        error: "Failed to download template",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

// Helper function to determine content type based on file extension
function getContentType(extension: string): string {
  switch (extension.toLowerCase()) {
    case "pdf":
      return "application/pdf"
    case "doc":
      return "application/msword"
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    case "xls":
      return "application/vnd.ms-excel"
    case "xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    case "ppt":
      return "application/vnd.ms-powerpoint"
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
    case "rtf":
      return "application/rtf"
    case "zip":
      return "application/zip"
    case "csv":
      return "text/csv"
    default:
      return "application/octet-stream" // Default binary file type
  }
}

// Helper function to create a Cloudinary signed URL
function cloudinarySignedUrl(publicId: string, resourceType: string): string {
  try {
    const { v2: cloudinary } = require("cloudinary")

    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    })

    return cloudinary.url(publicId, {
      secure: true,
      resource_type: resourceType,
      type: "upload",
      sign_url: true,
      attachment: true,
      expires_at: Math.floor(Date.now() / 1000) + 3600, // URL valid for 1 hour
    })
  } catch (error) {
    console.error("Error creating Cloudinary signed URL:", error)
    return ""
  }
}

