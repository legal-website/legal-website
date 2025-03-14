// Import the Cloudinary utility functions
import { getSignedUrl } from "@/lib/cloudinary"

/**
 * Generates a download URL for a document
 * @param fileUrl The original file URL
 * @returns A URL that will properly download the document
 */
export async function getDocumentDownloadUrl(fileUrl: string): Promise<string> {
  if (!fileUrl) {
    throw new Error("No file URL provided")
  }

  // Check if it's a Cloudinary URL
  if (fileUrl.includes("cloudinary.com")) {
    try {
      // For Cloudinary URLs, use the getSignedUrl function with attachment flag
      return await getSignedUrl(fileUrl, 3600)
    } catch (error) {
      console.error("Error generating signed Cloudinary URL:", error)
      // Fall back to the original URL if there's an error
      return fileUrl
    }
  }

  // For non-Cloudinary URLs, return the original URL
  return fileUrl
}

/**
 * Extracts the filename from a URL
 * @param url The file URL
 * @returns The filename
 */
export function getFilenameFromUrl(url: string): string {
  if (!url) return "document"

  // Remove query parameters
  const urlWithoutParams = url.split("?")[0]

  // Get the last part of the URL (the filename)
  const parts = urlWithoutParams.split("/")
  const filename = parts[parts.length - 1]

  // Decode URI components
  return decodeURIComponent(filename)
}

/**
 * Determines the content type based on file extension
 * @param filename The filename or URL
 * @returns The appropriate content type
 */
export function getContentTypeFromFilename(filename: string): string {
  if (!filename) return "application/octet-stream"

  const extension = filename.split(".").pop()?.toLowerCase()

  switch (extension) {
    case "pdf":
      return "application/pdf"
    case "doc":
      return "application/msword"
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    case "xls":
      return "application/vnd.ms-excel"
    case "xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    case "ppt":
      return "application/vnd.ms-powerpoint"
    case "pptx":
      return "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    case "jpg":
    case "jpeg":
      return "image/jpeg"
    case "png":
      return "image/png"
    case "gif":
      return "image/gif"
    case "txt":
      return "text/plain"
    case "csv":
      return "text/csv"
    default:
      return "application/octet-stream"
  }
}

