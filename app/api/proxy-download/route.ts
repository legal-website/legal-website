import { type NextRequest, NextResponse } from "next/server"
import { getSignedUrl } from "@/lib/cloudinary"

export async function GET(request: NextRequest) {
  try {
    // Get URL and content type from query parameters
    const url = request.nextUrl.searchParams.get("url")
    const contentType = request.nextUrl.searchParams.get("contentType") || "application/octet-stream"
    const templateId = request.nextUrl.searchParams.get("templateId")

    if (!url) {
      return NextResponse.json({ error: "URL parameter is required" }, { status: 400 })
    }

    // Generate a signed URL if it's a Cloudinary URL
    let downloadUrl = url
    if (url.includes("cloudinary.com")) {
      try {
        downloadUrl = await getSignedUrl(url, 3600)
      } catch (error) {
        console.error("Error generating signed URL:", error)
        // Continue with original URL if signed URL generation fails
      }
    }

    // Fetch the file
    const response = await fetch(downloadUrl)

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch file: ${response.statusText}` }, { status: response.status })
    }

    // Get the file data
    const fileData = await response.arrayBuffer()

    // Extract filename from URL or use a default
    const urlObj = new URL(url)
    const pathSegments = urlObj.pathname.split("/")
    const filename = pathSegments[pathSegments.length - 1] || "document"

    // Create a new response with the file data
    const fileResponse = new NextResponse(fileData, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache",
      },
    })

    // Log the download if templateId is provided
    if (templateId) {
      try {
        // You can implement download tracking here
        console.log(`Template downloaded: ${templateId}`)
      } catch (error) {
        console.error("Error logging template download:", error)
      }
    }

    return fileResponse
  } catch (error) {
    console.error("Error in proxy-download route:", error)
    return NextResponse.json({ error: "Failed to process download request" }, { status: 500 })
  }
}

