import { v2 as cloudinary } from "cloudinary"

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
})
// Define types for file uploads
type FileUpload = {
  buffer?: Buffer
  originalname?: string
  mimetype?: string
  path?: string
  name?: string
  type?: string
}

// Helper function to determine resource type based on file extension or mimetype
function getResourceType(fileInfo: { filename?: string; mimetype?: string }): "image" | "raw" | "video" | "auto" {
  // Try to get extension from filename
  const extension = fileInfo.filename?.split(".").pop()?.toLowerCase()

  // Check mimetype first if available
  const mimetype = fileInfo.mimetype?.toLowerCase() || ""

  if (mimetype.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"].includes(extension || "")) {
    return "image"
  }

  if (mimetype.startsWith("video/") || ["mp4", "mov", "avi", "wmv", "flv", "webm"].includes(extension || "")) {
    return "video"
  }

  if (
    mimetype === "application/pdf" ||
    mimetype.includes("word") ||
    mimetype.includes("excel") ||
    mimetype.includes("powerpoint") ||
    mimetype === "text/plain" ||
    mimetype === "text/csv" ||
    ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "rtf", "csv"].includes(extension || "")
  ) {
    return "raw"
  }

  return "auto"
}

// Upload a file to Cloudinary
export async function uploadToCloudinary(
  file: Buffer | string | FileUpload | File,
  folder = "uploads",
): Promise<string> {
  try {
    if (!file) {
      throw new Error("No file provided for upload")
    }

    // Handle browser File object
    if (typeof window !== "undefined" && file instanceof File) {
      return uploadBrowserFile(file, folder)
    }

    // Determine file type and extract relevant information
    const isBuffer = Buffer.isBuffer(file)
    const isFilePath = typeof file === "string"
    const isFileObject = !isBuffer && !isFilePath

    let fileBuffer: Buffer | null = null
    let filename = "document"
    let mimetype = ""

    if (isBuffer) {
      fileBuffer = file as Buffer
      // Default filename for buffers
      filename = "buffer-upload"
    } else if (isFilePath) {
      // It's a file path string
      filename = (file as string).split("/").pop() || "file-upload"
    } else if (isFileObject) {
      // It's a file object (from multer or similar)
      const fileObj = file as FileUpload

      if (fileObj.buffer) {
        fileBuffer = fileObj.buffer
      }

      filename = fileObj.originalname || fileObj.name || "file-upload"
      mimetype = fileObj.mimetype || fileObj.type || ""
    }

    // Determine resource type
    const resourceType = getResourceType({ filename, mimetype })
    console.log(`Uploading file ${filename} as resource type: ${resourceType}`)

    // Set upload options
    const uploadOptions: any = {
      resource_type: resourceType,
      folder: folder,
      use_filename: true,
      unique_filename: true,
      overwrite: false,
    }

    // Add specific options for documents
    if (resourceType === "raw") {
      uploadOptions.format = "auto"
      uploadOptions.attachment = true // Ensures the file is downloadable
    }

    // Upload the file
    let result

    if (isBuffer || (isFileObject && fileBuffer)) {
      // Upload using buffer
      result = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(uploadOptions, (error, result) => {
            if (error) reject(error)
            else resolve(result)
          })
          .end(isBuffer ? (file as Buffer) : fileBuffer!)
      })
    } else if (isFilePath) {
      // Upload using file path
      result = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader.upload(file as string, uploadOptions, (error, result) => {
          if (error) reject(error)
          else resolve(result)
        })
      })
    } else if (isFileObject && (file as FileUpload).path) {
      // Upload using file path from object
      const filePath = (file as FileUpload).path
      if (!filePath) {
        throw new Error("File path is undefined")
      }

      result = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader.upload(filePath, uploadOptions, (error, result) => {
          if (error) reject(error)
          else resolve(result)
        })
      })
    } else {
      throw new Error("Invalid file format. Could not determine how to upload.")
    }

    console.log(`File uploaded successfully to Cloudinary: ${result.secure_url}`)
    return result.secure_url
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error)
    throw error
  }
}

// Upload a browser File object to Cloudinary
async function uploadBrowserFile(file: File, folder = "uploads"): Promise<string> {
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
          folder: folder,
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

// Delete a file from Cloudinary
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId)
    return result.result === "ok"
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error)
    return false
  }
}

// Extract public ID and resource type from a Cloudinary URL
export function extractCloudinaryDetails(url: string): {
  publicId: string | null
  resourceType: "image" | "video" | "raw" | "auto"
  folderPath: string
} {
  try {
    // Default values
    let publicId: string | null = null
    let resourceType: "image" | "video" | "raw" | "auto" = "auto" // Default resource type
    let folderPath = ""

    // Check if it's a Cloudinary URL
    if (!url.includes("cloudinary.com")) {
      return { publicId, resourceType, folderPath }
    }

    // Determine resource type from URL
    if (url.includes("/image/")) {
      resourceType = "image"
    } else if (url.includes("/video/")) {
      resourceType = "video"
    } else if (url.includes("/raw/")) {
      resourceType = "raw"
    } else {
      // Try to determine from file extension
      const extension = url.split(".").pop()?.toLowerCase()
      if (extension) {
        if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(extension)) {
          resourceType = "image"
        } else if (["mp4", "mov", "avi", "wmv", "flv", "webm"].includes(extension)) {
          resourceType = "video"
        } else {
          resourceType = "raw"
        }
      }
    }

    // Extract the public ID
    // Format: https://res.cloudinary.com/cloud_name/resource_type/upload/v1234567890/folder/filename.ext
    const regex = new RegExp(`${resourceType}/upload/(?:v\\d+/)?(.+?)(?:\\.[^./]+)?$`)
    const match = url.match(regex)

    if (match && match[1]) {
      publicId = match[1]

      // Check if there's a folder path
      if (publicId.includes("/")) {
        const lastSlashIndex = publicId.lastIndexOf("/")
        folderPath = publicId.substring(0, lastSlashIndex)
      }
    } else {
      // Alternative approach for other URL formats
      const urlObj = new URL(url)
      const pathSegments = urlObj.pathname.split("/")

      // Find the upload segment
      const uploadIndex = pathSegments.findIndex((segment) => segment === "upload")

      if (uploadIndex !== -1 && uploadIndex < pathSegments.length - 1) {
        // Join all segments after 'upload', excluding version numbers (v1234567890)
        const relevantSegments = pathSegments.slice(uploadIndex + 1).filter((segment) => !segment.match(/^v\\d+$/))
        publicId = relevantSegments.join("/")

        // Remove file extension if present
        publicId = publicId.replace(/\.[^/.]+$/, "")

        // Extract folder path
        if (publicId.includes("/")) {
          const lastSlashIndex = publicId.lastIndexOf("/")
          folderPath = publicId.substring(0, lastSlashIndex)
        }
      }
    }

    console.log(`Extracted from URL ${url}:`, { publicId, resourceType, folderPath })
    return { publicId, resourceType, folderPath }
  } catch (error) {
    console.error("Error extracting Cloudinary details:", error)
    return { publicId: null, resourceType: "auto", folderPath: "" }
  }
}

// Generate a signed URL for a Cloudinary resource
export async function getSignedUrl(url: string, expiresIn = 3600): Promise<string> {
  try {
    const { publicId, resourceType } = extractCloudinaryDetails(url)

    if (!publicId) {
      console.error("Could not extract public ID from URL:", url)
      return url // Return original URL if we can't extract the public ID
    }

    console.log(`Generating signed URL for ${resourceType}/${publicId}`)

    // Generate signed URL with appropriate resource type
    const signedUrl = cloudinary.url(publicId, {
      secure: true,
      resource_type: resourceType,
      type: "upload",
      sign_url: true,
      attachment: true,
      expires_at: Math.floor(Date.now() / 1000) + expiresIn,
    })

    console.log(`Generated signed URL: ${signedUrl}`)
    return signedUrl
  } catch (error) {
    console.error("Error generating signed URL:", error)
    return url // Return original URL on error
  }
}

// For backward compatibility
export function extractPublicId(url: string): string | null {
  const { publicId } = extractCloudinaryDetails(url)
  return publicId
}

// For backward compatibility with the original implementation
export async function uploadToCloudinaryLegacy(file: File): Promise<string> {
  return uploadBrowserFile(file, "documents")
}

export default {
  uploadToCloudinary,
  uploadToCloudinaryLegacy,
  deleteFromCloudinary,
  getSignedUrl,
  extractPublicId,
}

