import { NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"

// Define the Cloudinary result type
interface CloudinaryUploadResult {
  secure_url: string
  public_id: string
  [key: string]: any // For other properties that might be returned
}

// Check if required environment variables are defined
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error("Missing required Cloudinary environment variables")
  throw new Error("Cloudinary configuration is incomplete")
}

// Configure Cloudinary with type assertions
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
  api_key: process.env.CLOUDINARY_API_KEY as string,
  api_secret: process.env.CLOUDINARY_API_SECRET as string,
})

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("receipt") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64Data = buffer.toString("base64")
    const fileType = file.type
    const dataURI = `data:${fileType};base64,${base64Data}`

    // Upload to Cloudinary using Promise with proper typing
    const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
      cloudinary.uploader.upload(
        dataURI,
        {
          folder: "receipts",
          resource_type: "auto",
        },
        (error, result) => {
          if (error) {
            reject(error)
          } else {
            resolve(result as CloudinaryUploadResult)
          }
        },
      )
    })

    return NextResponse.json({
      success: true,
      url: result.secure_url,
    })
  } catch (error: any) {
    console.error("Receipt upload error:", error)
    return NextResponse.json(
      {
        error: "Failed to upload receipt",
        message: error.message,
      },
      { status: 500 },
    )
  }
}

