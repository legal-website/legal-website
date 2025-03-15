// Cloudinary integration utility
import { v2 as cloudinary } from "cloudinary"

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
})

/**
 * Upload a file to Cloudinary
 * @param file The file to upload
 * @returns The URL of the uploaded file
 */
export async function uploadToCloudinary(file: File): Promise<string> {
  try {
    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64Data = buffer.toString("base64")
    const dataURI = `data:${file.type};base64,${base64Data}`

    // Upload to Cloudinary
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload(
        dataURI,
        {
          folder: "business_documents",
          resource_type: "auto",
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        },
      )
    })

    return result.secure_url
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error)
    throw new Error("Failed to upload file to Cloudinary")
  }
}

/**
 * Get a signed URL for a Cloudinary resource
 * @param url The Cloudinary URL
 * @param expiresIn Expiration time in seconds (default: 1 hour)
 * @returns A signed URL with a limited lifetime
 */
export function getSignedUrl(url: string, expiresIn = 3600): string {
  try {
    const publicId = extractPublicId(url)
    if (!publicId) return url

    const timestamp = Math.floor(Date.now() / 1000)
    const expiryTimestamp = timestamp + expiresIn

    return cloudinary.url(publicId, {
      secure: true,
      sign_url: true,
      expires_at: expiryTimestamp,
    })
  } catch (error) {
    console.error("Error generating signed URL:", error)
    return url
  }
}

/**
 * Extract the public ID from a Cloudinary URL
 * @param url The Cloudinary URL
 * @returns The public ID
 */
export function extractPublicId(url: string): string | null {
  try {
    // Example URL: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/file.jpg
    const regex = /\/v\d+\/(.+)\.\w+$/
    const match = url.match(regex)
    return match ? match[1] : null
  } catch (error) {
    console.error("Error extracting public ID:", error)
    return null
  }
}

/**
 * Delete a file from Cloudinary
 * @param url The Cloudinary URL of the file to delete
 * @returns True if deletion was successful, false otherwise
 */
export async function deleteFromCloudinary(url: string): Promise<boolean> {
  try {
    const publicId = extractPublicId(url)
    if (!publicId) return false

    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) reject(error)
        else resolve(result)
      })
    })

    return result.result === "ok"
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error)
    return false
  }
}