// Cloudinary integration utility
import { v2 as cloudinary } from "cloudinary"

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
})

export async function uploadToCloudinary(file: File): Promise<string> {
  try {
    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64Data = buffer.toString("base64")
    const fileType = file.type
    const dataURI = `data:${fileType};base64,${base64Data}`

    console.log(`Uploading file to Cloudinary: ${file.name} (${file.type}, ${file.size} bytes)`)

    // Determine resource type based on file type
    let resourceType = "auto"
    if (fileType.startsWith("image/")) {
      resourceType = "image"
    } else if (fileType.startsWith("video/")) {
      resourceType = "video"
    } else if (
      fileType === "application/pdf" ||
      fileType === "application/msword" ||
      fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      fileType === "application/vnd.ms-excel" ||
      fileType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      fileType === "application/vnd.ms-powerpoint" ||
      fileType === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
      fileType === "text/plain" ||
      fileType === "application/rtf" ||
      fileType === "application/zip" ||
      fileType === "text/csv"
    ) {
      resourceType = "raw"
    }

    // Upload to Cloudinary with proper resource type detection
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload(
        dataURI,
        {
          folder: "documents",
          resource_type: resourceType,
          use_filename: true,
          unique_filename: true,
          overwrite: false,
          access_mode: "public",
          type: "upload",
        },
        (error: any, result: any) => {
          if (error) {
            console.error("Cloudinary upload error:", error)
            reject(error)
          } else {
            console.log("Cloudinary upload success:", result.secure_url)
            resolve(result)
          }
        },
      )
    })

    return result.secure_url
  } catch (error) {
    console.error("Cloudinary upload error:", error)
    throw new Error("Failed to upload file to Cloudinary")
  }
}

