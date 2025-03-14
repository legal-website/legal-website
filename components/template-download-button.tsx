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
      // Try direct download first - this will either return the file directly or provide the URL
      const response = await fetch(`/api/user/templates/${templateId}/download`)

      if (!response.ok) {
        throw new Error(`Failed to get download information: ${response.status}`)
      }

      // Check if the response is a file (binary) or JSON
      const contentType = response.headers.get("content-type") || ""

      // If it's a file, create a download link
      if (!contentType.includes("application/json")) {
        console.log("Received file directly from server")

        // Get the filename from the Content-Disposition header
        const contentDisposition = response.headers.get("content-disposition") || ""
        const filenameMatch = contentDisposition.match(/filename="(.+?)"/)
        const filename = filenameMatch ? filenameMatch[1] : `document-${templateId}`

        // Create a blob from the response
        const blob = await response.blob()

        // Create a download link
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.style.display = "none"
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()

        // Clean up
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Download complete",
          description: `${filename} has been downloaded`,
        })

        setIsLoading(false)
        return
      }

      // If we get here, the response is JSON with the file URL
      const data = await response.json()

      if (!data.success || !data.fileUrl) {
        throw new Error(data.error || "Failed to get download URL")
      }

      console.log("Received download information:", data)

      // Get the filename
      const filename = `${data.name}${data.fileExtension ? `.${data.fileExtension}` : ""}`

      // If there was a Cloudinary error, try the proxy download
      if (data.cloudinaryError) {
        console.log("Cloudinary direct download failed, using proxy download")
        const proxyUrl = `/api/proxy-download?url=${encodeURIComponent(data.fileUrl)}&contentType=${encodeURIComponent(
          data.contentType || "application/octet-stream",
        )}&templateId=${templateId}&filename=${encodeURIComponent(filename)}`

        window.location.href = proxyUrl

        toast({
          title: "Download started",
          description: `${filename} is being downloaded`,
        })

        setIsLoading(false)
        return
      }

      // Try to download the file directly from the browser
      try {
        console.log("Attempting direct browser download")

        const fileResponse = await fetch(data.fileUrl)

        if (!fileResponse.ok) {
          throw new Error(`Failed to fetch file: ${fileResponse.status}`)
        }

        const blob = await fileResponse.blob()

        // Create a download link
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.style.display = "none"
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()

        // Clean up
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Download complete",
          description: `${filename} has been downloaded`,
        })
      } catch (directError) {
        console.error("Direct browser download failed:", directError)

        // Fall back to proxy download
        toast({
          title: "Trying alternative download method",
          description: "Direct download failed, trying server-side download...",
        })

        const proxyUrl = `/api/proxy-download?url=${encodeURIComponent(data.fileUrl)}&contentType=${encodeURIComponent(
          data.contentType || "application/octet-stream",
        )}&templateId=${templateId}&filename=${encodeURIComponent(filename)}`

        window.location.href = proxyUrl

        toast({
          title: "Download started",
          description: `${filename} is being downloaded`,
        })
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

