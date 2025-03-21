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
 * @param fileOrDataUri The file or data URI to upload
 * @param options Additional options for the upload
 * @returns The result from Cloudinary including secure_url
 */
export async function uploadToCloudinary(
  fileOrDataUri: File | string,
  options: Record<string, any> = {},
): Promise<any> {
  try {
    let dataURI: string

    if (typeof fileOrDataUri === "string") {
      // If already a data URI, use it directly
      dataURI = fileOrDataUri
      console.log("Using provided data URI for Cloudinary upload")
    } else {
      // Convert File to data URI
      console.log("Starting Cloudinary upload for file:", fileOrDataUri.name)
      const arrayBuffer = await fileOrDataUri.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const base64Data = buffer.toString("base64")
      dataURI = `data:${fileOrDataUri.type};base64,${base64Data}`
    }

    // Default options
    const uploadOptions = {
      folder: "business_documents",
      resource_type: "auto",
      ...options,
    }

    // Upload to Cloudinary
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(dataURI, uploadOptions, (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error)
          reject(new Error("Failed to upload file to cloud storage"))
        } else {
          console.log("Cloudinary upload successful, URL:", result?.secure_url)
          // Return just the URL string if returnUrl is true
          if (options.returnUrl === true) {
            resolve(result?.secure_url || "")
          } else {
            resolve(result)
          }
        }
      })
    })
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error)
    throw new Error("Failed to upload file to cloud storage")
  }
}

/**
 * Upload a file to Cloudinary and return just the URL
 * @param file The file to upload
 * @param options Additional options for the upload
 * @returns The URL of the uploaded file
 */
export async function uploadFileToCloudinary(file: File, options: Record<string, any> = {}): Promise<string> {
  const result = await uploadToCloudinary(file, { ...options, returnUrl: true })
  if (typeof result === "string") {
    return result
  } else if (result && typeof result === "object" && "secure_url" in result) {
    return result.secure_url as string
  }
  return ""
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

/**
 * Extract Cloudinary details from a URL
 * @param url The Cloudinary URL
 * @returns Object containing publicId, resourceType, and folderPath
 */
export function extractCloudinaryDetails(url: string) {
  try {
    // Default values
    let publicId = ""
    let resourceType = "auto"
    let folderPath = ""

    // Check if this is a Cloudinary URL
    if (!url.includes("cloudinary.com")) {
      return { publicId, resourceType, folderPath }
    }

    // Extract resource type (image, video, raw)
    if (url.includes("/image/")) resourceType = "image"
    else if (url.includes("/video/")) resourceType = "video"
    else if (url.includes("/raw/")) resourceType = "raw"

    // Extract public ID and folder path
    // Format: https://res.cloudinary.com/cloud_name/resource_type/upload/v1234567890/folder/filename.ext
    const regex = /\/(?:v\d+\/)?(.+?)(?:\.\w+)?(?:\?|$)/
    const match = url.match(regex)

    if (match && match[1]) {
      publicId = match[1]

      // Extract folder path if present
      const pathParts = publicId.split("/")
      if (pathParts.length > 1) {
        folderPath = pathParts.slice(0, -1).join("/")
      }
    }

    return { publicId, resourceType, folderPath }
  } catch (error) {
    console.error("Error extracting Cloudinary details:", error)
    return { publicId: "", resourceType: "auto", folderPath: "" }
  }
}

export default cloudinary