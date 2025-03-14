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

      if (!data.success || !data.url) {
        throw new Error(data.error || "Failed to get download URL")
      }

      // Try the primary download method
      try {
        await downloadFile(data.url, data.filename)
        toast({
          title: "Download started",
          description: `${data.filename} is being downloaded`,
        })
      } catch (primaryError) {
        console.error("Primary download method failed:", primaryError)

        // If primary method fails, try the direct download method
        if (data.directUrl) {
          toast({
            title: "Trying alternative download method",
            description: "The first download attempt failed, trying another method...",
          })

          // Use the direct download endpoint
          window.location.href = data.directUrl
        } else {
          throw primaryError
        }
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

  // Helper function to download a file from a URL
  const downloadFile = async (url: string, filename: string) => {
    try {
      // Fetch the file
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status}`)
      }

      // Get the file content as a blob
      const blob = await response.blob()

      // Create a download link
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = filename

      // Append to the document, click, and remove
      document.body.appendChild(link)
      link.click()
      window.URL.revokeObjectURL(downloadUrl)
      document.body.removeChild(link)
    } catch (error) {
      console.error("Error downloading file:", error)
      throw error
    }
  }

  return (
    <Button onClick={downloadTemplate} disabled={isLoading} variant={variant} className={className}>
      {isLoading ? "Downloading..." : buttonText}
      {!isLoading && <Download className="ml-2 h-4 w-4" />}
    </Button>
  )
}

