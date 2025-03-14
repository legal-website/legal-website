"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface TemplateDownloadButtonProps {
  templateId: string
  buttonText?: string
  className?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
}

export function TemplateDownloadButton({
  templateId,
  buttonText = "Download",
  className = "",
  variant = "default",
}: TemplateDownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const downloadTemplate = async () => {
    setIsLoading(true)

    try {
      // First attempt: Get the download URL from the API
      const response = await fetch(`/api/user/templates/${templateId}/download`)

      if (!response.ok) {
        throw new Error(`Failed to get download URL: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success || !data.fileUrl) {
        throw new Error(data.error || "Failed to get download URL")
      }

      // Get the filename
      const filename = `${data.name}${data.fileExtension ? `.${data.fileExtension}` : ""}`

      // Check if this is a Cloudinary URL
      const isCloudinaryUrl = data.fileUrl.includes("cloudinary.com")

      if (isCloudinaryUrl) {
        console.log("Cloudinary URL detected, using specialized download endpoint")

        // Extract public ID from URL if possible
        let publicId = null
        let resourceType = "image"

        try {
          // Parse the URL
          const parsedUrl = new URL(data.fileUrl)
          const pathParts = parsedUrl.pathname.split("/")

          // Find the upload part index
          const uploadIndex = pathParts.findIndex((part) => part === "upload")
          if (uploadIndex !== -1) {
            // Determine resource type from URL
            if (pathParts.includes("raw")) {
              resourceType = "raw"
            } else if (pathParts.includes("video")) {
              resourceType = "video"
            } else if (data.fileUrl.toLowerCase().endsWith(".pdf") || data.contentType === "application/pdf") {
              resourceType = "raw" // PDFs should use raw
            }

            // Extract the public ID including folder structure
            const relevantParts = pathParts.slice(uploadIndex + 1).filter((part) => !part.match(/^v\d+$/))
            publicId = relevantParts.join("/")

            // Remove file extension if present
            if (publicId.includes(".")) {
              publicId = publicId.substring(0, publicId.lastIndexOf("."))
            }
          }
        } catch (error) {
          console.error("Error extracting public ID:", error)
        }

        // Use the Cloudinary download endpoint
        const cloudinaryUrl = `/api/cloudinary-download?url=${encodeURIComponent(data.fileUrl)}${publicId ? `&publicId=${encodeURIComponent(publicId)}` : ""}${resourceType ? `&resourceType=${resourceType}` : ""}&filename=${encodeURIComponent(filename)}`

        window.location.href = cloudinaryUrl

        toast({
          title: "Download started",
          description: `${filename} is being downloaded`,
        })

        setIsLoading(false)
        return
      }

      // For PDFs, always use the proxy download endpoint
      const isPdf =
        data.fileUrl.toLowerCase().endsWith(".pdf") ||
        data.contentType === "application/pdf" ||
        data.fileExtension === "pdf"

      if (isPdf) {
        console.log("PDF detected, using proxy download")
        const proxyUrl = `/api/proxy-download?url=${encodeURIComponent(data.fileUrl)}&contentType=${encodeURIComponent(data.contentType || "application/pdf")}&templateId=${templateId}&filename=${encodeURIComponent(filename)}`

        window.location.href = proxyUrl

        toast({
          title: "Download started",
          description: `${filename} is being downloaded`,
        })

        setIsLoading(false)
        return
      }

      // Try the direct download method first
      try {
        const directUrl = `/api/direct-download?documentId=${templateId}&filename=${encodeURIComponent(filename)}`
        window.location.href = directUrl

        toast({
          title: "Download started",
          description: `${filename} is being downloaded`,
        })
      } catch (primaryError) {
        console.error("Primary download method failed:", primaryError)

        // If primary method fails, try the proxy download method
        toast({
          title: "Trying alternative download method",
          description: "The first download attempt failed, trying another method...",
        })

        // Use the proxy download endpoint
        const proxyUrl = `/api/proxy-download?url=${encodeURIComponent(data.fileUrl)}&contentType=${encodeURIComponent(data.contentType || "application/octet-stream")}&templateId=${templateId}&filename=${encodeURIComponent(filename)}`
        window.location.href = proxyUrl
      }
    } catch (error) {
      console.error("Download error:", error)
      toast({
        title: "Download failed",
        description: (error as Error).message || "Failed to download the template",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={downloadTemplate} disabled={isLoading} variant={variant} className={className}>
      {isLoading ? "Downloading..." : buttonText}
      {!isLoading && <Download className="ml-2 h-4 w-4" />}
    </Button>
  )
}

