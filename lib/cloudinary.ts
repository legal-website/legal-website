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
 * @param buffer The file buffer to upload
 * @param filename Optional filename to use
 * @returns The URL of the uploaded file
 */
export async function uploadToCloudinary(buffer: Buffer, filename?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadOptions: any = {
      resource_type: "auto",
      folder: "legal-templates",
    }

    if (filename) {
      // Use the filename as the public_id but remove the extension
      const publicId = filename.split(".")[0]
      uploadOptions.public_id = publicId
    }

    // Convert buffer to base64 string for Cloudinary
    const base64String = buffer.toString("base64")
    const dataURI = `data:application/octet-stream;base64,${base64String}`

    cloudinary.uploader.upload(dataURI, uploadOptions, (error, result) => {
      if (error) {
        console.error("Cloudinary upload error:", error)
        reject(error)
      } else {
        resolve(result?.secure_url || "")
      }
    })
  })
}

/**
 * Delete a file from Cloudinary
 * @param url The URL of the file to delete
 */
export async function deleteFromCloudinary(url: string): Promise<void> {
  try {
    // Extract the public ID from the URL
    const publicId = url.split("/").pop()?.split(".")[0]
    if (!publicId) return

    await cloudinary.uploader.destroy(publicId)
  } catch (error) {
    console.error("Cloudinary delete error:", error)
  }
}

