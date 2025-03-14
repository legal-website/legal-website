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

      // Try the new Cloudinary direct download endpoint first for Cloudinary URLs
      if (isCloudinaryUrl) {
        console.log("Using Cloudinary direct download endpoint")
        window.location.href = `/api/cloudinary-direct?documentId=${templateId}&filename=${encodeURIComponent(filename)}`

        toast({
          title: "Download started",
          description: `${filename} is being downloaded`,
        })

        setIsLoading(false)
        return
      }

      // For PDFs, use the proxy download endpoint
      const isPdf =
        data.fileUrl.toLowerCase().endsWith(".pdf") ||
        data.contentType === "application/pdf" ||
        data.fileExtension === "pdf"

      if (isPdf) {
        console.log("PDF detected, using proxy download")
        const proxyUrl = `/api/proxy-download?url=${encodeURIComponent(data.fileUrl)}&contentType=${encodeURIComponent(
          data.contentType || "application/pdf",
        )}&templateId=${templateId}&filename=${encodeURIComponent(filename)}`

        window.location.href = proxyUrl

        toast({
          title: "Download started",
          description: `${filename} is being downloaded`,
        })

        setIsLoading(false)
        return
      }

      // Try the direct download method
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
        const proxyUrl = `/api/proxy-download?url=${encodeURIComponent(data.fileUrl)}&contentType=${encodeURIComponent(
          data.contentType || "application/octet-stream",
        )}&templateId=${templateId}&filename=${encodeURIComponent(filename)}`
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

