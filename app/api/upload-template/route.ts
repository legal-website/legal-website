import { NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

// Define the Cloudinary result type
interface CloudinaryUploadResult {
  secure_url: string
  public_id: string
  [key: string]: any // For other properties that might be returned
}

export async function POST(req: Request) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Configure Cloudinary inside the handler
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error("Missing required Cloudinary environment variables")
      return NextResponse.json(
        { error: "Server configuration error", message: "Cloudinary configuration is incomplete" },
        { status: 500 },
      )
    }

    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    })

    // Parse form data
    let formData
    try {
      formData = await req.formData()
    } catch (formError) {
      console.error("Error parsing form data:", formError)
      return NextResponse.json(
        { error: "Invalid form data", message: "Could not parse the uploaded form data" },
        { status: 400 },
      )
    }

    // Get file from form data
    const file = formData.get("file")
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided", message: "Please upload a valid file" }, { status: 400 })
    }

    console.log("File received:", file.name, "Size:", file.size, "Type:", file.type)

    // Convert file to base64
    let dataURI
    try {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const base64Data = buffer.toString("base64")
      dataURI = `data:${file.type};base64,${base64Data}`
      console.log("File converted to base64 successfully")
    } catch (conversionError) {
      console.error("Error converting file to base64:", conversionError)
      return NextResponse.json(
        { error: "File processing error", message: "Could not process the uploaded file" },
        { status: 500 },
      )
    }

    // Upload to Cloudinary
    let uploadResult
    try {
      uploadResult = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
        cloudinary.uploader.upload(
          dataURI,
          {
            folder: "templates",
            resource_type: "auto",
          },
          (error, result) => {
            if (error) {
              console.error("Cloudinary upload error:", error)
              reject(error)
            } else if (!result || !result.secure_url) {
              console.error("Invalid Cloudinary result:", result)
              reject(new Error("Invalid response from Cloudinary"))
            } else {
              console.log("Cloudinary upload successful:", result.public_id)
              resolve(result)
            }
          },
        )
      })
    } catch (uploadError: any) {
      console.error("Error during Cloudinary upload:", uploadError)
      return NextResponse.json(
        {
          error: "Upload failed",
          message: uploadError.message || "Failed to upload file to Cloudinary",
          details: uploadError.toString(),
        },
        { status: 500 },
      )
    }

    // Return success response
    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
    })
  } catch (error: any) {
    // Catch-all error handler
    console.error("Unhandled error in upload-template route:", error)
    return NextResponse.json(
      {
        error: "Server error",
        message: error.message || "An unexpected error occurred",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

