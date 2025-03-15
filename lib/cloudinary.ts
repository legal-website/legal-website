// Cloudinary integration utility
import { v2 as cloudinary } from "cloudinary"

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
})

/**
 * Extracts the public ID from a Cloudinary URL.
 * @param url The Cloudinary URL.
 * @returns The public ID, or null if it cannot be extracted.
 */
function extractPublicId(url: string): string | null {
  try {
    const urlParts = url.split("/")
    const imageName = urlParts[urlParts.length - 1]
    const imageNameParts = imageName.split(".")
    return imageNameParts[0]
  } catch (error) {
    console.error("Error extracting public ID:", error)
    return null
  }
}

/**
 * Gets the file extension from a URL.
 * @param url The URL.
 * @returns The file extension, or null if it cannot be determined.
 */
function getFileExtension(url: string): string | null {
  try {
    const urlParts = url.split(".")
    if (urlParts.length > 1) {
      return urlParts[urlParts.length - 1]
    }
    return null
  } catch (error) {
    console.error("Error getting file extension:", error)
    return null
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
    // Extract public ID from URL
    const publicId = extractPublicId(url)

    if (!publicId) {
      console.warn("Could not extract public ID from URL:", url)
      return url // Return original URL if can't extract public ID
    }

    // Get file extension from URL
    const extension = getFileExtension(url)

    // For PDF files, we need to use a different approach
    // Instead of modifying the URL, we'll create a direct download link
    const resourceType = guessResourceType(url, extension)

    // Generate a direct download URL
    const downloadUrl = cloudinary.url(publicId, {
      resource_type: resourceType,
      secure: true,
      sign_url: true,
      type: "private",
      expires_at: Math.floor(Date.now() / 1000) + expiresIn,
      attachment: true, // This is the key parameter for forcing download
    })

    console.log("Generated signed download URL:", downloadUrl)
    return downloadUrl
  } catch (error) {
    console.error("Error generating signed download URL:", error)
    return url // Return original URL on error
  }
}

/**
 * Guess the resource type based on file extension
 * @param url The URL
 * @param extension The file extension
 * @returns The resource type (image, video, raw, auto)
 */
export function guessResourceType(url: string, extension: string | null): string {
  // Default to 'raw' for documents
  if (!extension) {
    return "raw"
  }

  // Check extension to determine resource type
  const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff", "svg"]
  const videoExtensions = ["mp4", "mov", "avi", "wmv", "flv", "webm"]

  if (imageExtensions.includes(extension.toLowerCase())) {
    return "image"
  }

  if (videoExtensions.includes(extension.toLowerCase())) {
    return "video"
  }

  // For PDFs and other documents, use 'raw'
  return "raw"
}