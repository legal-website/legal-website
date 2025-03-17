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
    console.log("Starting Cloudinary upload for file:", file.name)

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64Data = buffer.toString("base64")
    const dataURI = `data:${file.type};base64,${base64Data}`

    // Upload to Cloudinary
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        dataURI,
        {
          folder: "business_documents",
          resource_type: "auto",
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error)
            reject(new Error("Failed to upload file to cloud storage"))
          } else {
            console.log("Cloudinary upload successful, URL:", result?.secure_url)
            resolve(result?.secure_url || "")
          }
        },
      )
    })
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error)
    throw new Error("Failed to upload file to cloud storage")
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
    // Extract public ID from URL
    const publicId = extractPublicId(url)

    if (!publicId) {
      return url // Return original URL if can't extract public ID
    }

    // Generate signed URL
    const signedUrl = cloudinary.url(publicId, {
      secure: true,
      sign_url: true,
      expires_at: Math.floor(Date.now() / 1000) + expiresIn,
    })

    return signedUrl
  } catch (error) {
    console.error("Error generating signed URL:", error)
    return url // Return original URL on error
  }
}

/**
 * Extract the public ID from a Cloudinary URL
 * @param url The Cloudinary URL
 * @returns The public ID
 */
export function extractPublicId(url: string): string | null {
  try {
    // Extract public ID from Cloudinary URL
    // Format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/filename.ext
    const regex = /\/v\d+\/(.+)\.\w+$/
    const match = url.match(regex)

    if (match && match[1]) {
      return match[1]
    }

    return null
  } catch (error) {
    console.error("Error extracting public ID:", error)
    return null
  }
}

/**
 * Delete a file from Cloudinary
 * @param publicId The public ID of the file to delete
 * @returns True if deletion was successful, false otherwise
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  try {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, { resource_type: "auto" }, (error, result) => {
        if (error) {
          console.error("Cloudinary delete error:", error)
          reject(new Error("Failed to delete file from cloud storage"))
        } else {
          resolve(result?.result === "ok")
        }
      })
    })
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error)
    return false
  }
}

