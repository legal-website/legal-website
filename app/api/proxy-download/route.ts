import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get URL and content type from query parameters
    const url = request.nextUrl.searchParams.get("url")
    const contentType = request.nextUrl.searchParams.get("contentType") || "application/octet-stream"

    if (!url) {
      return NextResponse.json({ error: "Missing URL parameter" }, { status: 400 })
    }

    console.log(`Proxying download for: ${url} (${contentType})`)

    // Fetch the file from the source
    const response = await fetch(url, {
      headers: {
        Accept: "*/*",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })

    if (!response.ok) {
      console.error(`Failed to fetch file: ${response.status} ${response.statusText}`)
      return NextResponse.json({ error: "Failed to fetch file" }, { status: response.status })
    }

    // Get the file as an array buffer
    const arrayBuffer = await response.arrayBuffer()

    // Extract filename from URL
    const urlObj = new URL(url)
    const pathSegments = urlObj.pathname.split("/")
    const filenameWithParams = pathSegments[pathSegments.length - 1]
    const filename = filenameWithParams.split("?")[0]

    // Create response with appropriate headers
    const headers = new Headers()
    headers.set("Content-Type", contentType)
    headers.set("Content-Disposition", `attachment; filename="${filename}"`)
    headers.set("Content-Length", arrayBuffer.byteLength.toString())
    headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
    headers.set("Pragma", "no-cache")
    headers.set("Expires", "0")

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error("Error in proxy download:", error)
    return NextResponse.json({ error: "Failed to proxy download" }, { status: 500 })
  }
}

