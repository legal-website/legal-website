import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import fs from "fs"
import path from "path"
import os from "os"
import { Readable } from "stream"
import { pipeline } from "stream/promises"

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get URL from query parameters
    const url = request.nextUrl.searchParams.get("url")
    const documentId = request.nextUrl.searchParams.get("documentId")
    const filename = request.nextUrl.searchParams.get("filename") || "document"

    if (!url && !documentId) {
      return NextResponse.json({ error: "Missing URL or documentId parameter" }, { status: 400 })
    }

    let fileUrl = url

    // If document ID is provided, get the file URL from the database
    if (documentId) {
      const document = await prisma.document.findUnique({
        where: {
          id: documentId,
        },
      })

      if (!document || !document.fileUrl) {
        return NextResponse.json({ error: "Document not found or has no file URL" }, { status: 404 })
      }

      fileUrl = document.fileUrl
    }

    if (!fileUrl) {
      return NextResponse.json({ error: "No file URL available" }, { status: 400 })
    }

    console.log(`File download requested for: ${fileUrl}`)

    // Create a temporary file to store the download
    const tmpDir = os.tmpdir()
    const tmpFilePath = path.join(tmpDir, `download-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`)

    try {
      // Download the file to the temporary location
      const response = await fetch(fileUrl)

      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`)
      }

      const fileStream = fs.createWriteStream(tmpFilePath)
      await pipeline(Readable.fromWeb(response.body as any), fileStream)

      // Check if the file was downloaded successfully
      const stats = fs.statSync(tmpFilePath)

      if (stats.size === 0) {
        throw new Error("Downloaded file is empty")
      }

      // Read the file and return it
      const fileBuffer = fs.readFileSync(tmpFilePath)

      // Determine content type based on file extension or response headers
      const contentType = response.headers.get("content-type") || "application/octet-stream"

      // Extract file extension from URL or filename
      let fileExtension = ""
      if (filename.includes(".")) {
        fileExtension = filename.split(".").pop() || ""
      } else {
        const urlWithoutParams = fileUrl.split("?")[0]
        const urlParts = urlWithoutParams.split(".")
        if (urlParts.length > 1) {
          fileExtension = urlParts[urlParts.length - 1].toLowerCase()
        }
      }

      // Ensure filename has an extension
      let finalFilename = filename
      if (!finalFilename.includes(".") && fileExtension) {
        finalFilename = `${finalFilename}.${fileExtension}`
      }

      // Create response with appropriate headers
      const headers = new Headers()
      headers.set("Content-Type", contentType)
      headers.set("Content-Disposition", `attachment; filename="${finalFilename}"`)
      headers.set("Content-Length", stats.size.toString())
      headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
      headers.set("Pragma", "no-cache")
      headers.set("Expires", "0")

      // Clean up the temporary file
      fs.unlinkSync(tmpFilePath)

      return new NextResponse(fileBuffer, {
        status: 200,
        headers,
      })
    } catch (error) {
      console.error("Error in file download:", error)

      // Clean up the temporary file if it exists
      if (fs.existsSync(tmpFilePath)) {
        fs.unlinkSync(tmpFilePath)
      }

      return NextResponse.json(
        {
          error: "Failed to download file",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in file download route:", error)
    return NextResponse.json(
      {
        error: "Failed to process download request",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

