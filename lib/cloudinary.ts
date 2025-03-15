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
          // Add attachment flag to ensure proper download
          flags: "attachment",
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
 * Get a signed URL for a Cloudinary resource with download parameters
 * @param url The Cloudinary URL
 * @param filename The filename to use for download
 * @param expiresIn Expiration time in seconds (default: 1 hour)
 * @returns A signed URL with a limited lifetime and download parameters
 */
export function getSignedDownloadUrl(url: string, filename: string, expiresIn = 3600): string {
  try {
    console.log("Original Cloudinary URL:", url)

    // The URL is likely in the format:
    // https://res.cloudinary.com/cloud_name/image|video|raw/upload/v1234567890/folder/file.ext

    // Extract the cloud name
    const cloudNameMatch = url.match(/res\.cloudinary\.com\/([^/]+)\//)
    const cloudName = cloudNameMatch ? cloudNameMatch[1] : process.env.CLOUDINARY_CLOUD_NAME

    if (!cloudName) {
      console.warn("Could not determine cloud name from URL:", url)
      return url
    }

    // Determine if this is a private or public resource
    const isPrivate = url.includes("/private/")
    const deliveryType = isPrivate ? "private" : "upload"

    // Extract the resource type (image, video, raw)
    let resourceType = "raw" // Default to raw for documents
    if (url.includes("/image/")) resourceType = "image"
    else if (url.includes("/video/")) resourceType = "video"

    // Extract the public ID - this is the trickiest part
    // The public ID is everything after upload/ or private/ and before any query parameters
    let publicId = ""
    const uploadMatch = url.match(new RegExp(`/${deliveryType}/(?:v\\d+/)?(.+?)(?:\\?|$)`))

    if (uploadMatch && uploadMatch[1]) {
      publicId = uploadMatch[1]

      // Remove any transformation parameters if present
      // These would be like s--XXXXX--/ at the beginning of the public ID
      publicId = publicId.replace(/^s--[a-zA-Z0-9_-]+--\//, "")

      // Remove file extension if present
      publicId = publicId.replace(/\.[^/.]+$/, "")
    } else {
      // Fallback: try to extract the UUID which is likely the public ID
      const uuidMatch = url.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i)
      if (uuidMatch) {
        publicId = uuidMatch[1]
      } else {
        console.warn("Could not extract public ID from URL:", url)
        return url
      }
    }

    console.log("Extracted public ID:", publicId)
    console.log("Resource type:", resourceType)
    console.log("Delivery type:", deliveryType)

    // Generate a direct download URL using the Cloudinary SDK
    const downloadUrl = cloudinary.url(publicId, {
      cloud_name: cloudName,
      resource_type: resourceType,
      type: deliveryType,
      secure: true,
      sign_url: true,
      flags: "attachment", // Force download
      download: filename, // Set download filename
      expires_at: Math.floor(Date.now() / 1000) + expiresIn,
    })

    console.log("Generated download URL:", downloadUrl)
    return downloadUrl
  } catch (error) {
    console.error("Error generating signed download URL:", error)
    return url // Return original URL on error
  }
}

/**
 * Get a signed URL for a Cloudinary resource (legacy function)
 * @param url The Cloudinary URL
 * @param expiresIn Expiration time in seconds (default: 1 hour)
 * @returns A signed URL with a limited lifetime
 */
export function getSignedUrl(url: string, expiresIn = 3600): string {
  console.log("Warning: getSignedUrl is deprecated, use getSignedDownloadUrl instead")
  return getSignedDownloadUrl(url, getFilenameFromUrl(url), expiresIn)
}

/**
 * Extract filename from URL
 * @param url The URL
 * @returns The filename
 */
export function getFilenameFromUrl(url: string): string {
  try {
    const urlParts = url.split("/")
    const filenameWithParams = urlParts[urlParts.length - 1]
    const filename = filenameWithParams.split("?")[0]
    return filename || "download"
  } catch (error) {
    console.error("Error extracting filename from URL:", error)
    return "download"
  }
}

/**
 * Get file extension from URL
 * @param url The URL
 * @returns The file extension or null
 */
export function getFileExtension(url: string): string | null {
  try {
    const match = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/)
    return match ? match[1].toLowerCase() : null
  } catch (error) {
    console.error("Error extracting file extension:", error)
    return null
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

    // First, try the standard format
    let match = url.match(/\/v\d+\/(.+?)(?:\.\w+)?$/)

    if (match && match[1]) {
      return match[1]
    }

    // Try alternative format (without version number)
    match = url.match(/\/upload\/(.+?)(?:\.\w+)?$/)

    if (match && match[1]) {
      return match[1]
    }

    console.warn("Could not extract public ID using regex from URL:", url)

    // If regex fails, try a more basic approach
    const urlParts = url.split("/")
    const filename = urlParts[urlParts.length - 1].split(".")[0]
    const folder = urlParts[urlParts.length - 2]

    if (folder && filename && folder !== "upload") {
      return `${folder}/${filename}`
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