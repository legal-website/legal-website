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

      if (!data.success) {
        throw new Error(data.error || "Failed to get download URL")
      }

      // Get the filename
      const filename = `${data.name}${data.fileExtension ? `.${data.fileExtension}` : ""}`

      // Try the recommended download method first
      if (data.recommendedUrl) {
        console.log("Trying recommended download method...")
        window.location.href = data.recommendedUrl

        toast({
          title: "Download started",
          description: `${filename} is being downloaded`,
        })

        setIsLoading(false)
        return
      }

      // If no recommended URL, try the download options in order
      if (data.downloadOptions) {
        const options = data.downloadOptions

        // Try proxy download first
        if (options.proxy) {
          console.log("Trying proxy download...")
          window.location.href = options.proxy

          toast({
            title: "Download started",
            description: `${filename} is being downloaded`,
          })

          setIsLoading(false)
          return
        }

        // Try Cloudinary direct
        if (options.cloudinaryDirect) {
          console.log("Trying Cloudinary direct download...")
          window.location.href = options.cloudinaryDirect

          toast({
            title: "Download started",
            description: `${filename} is being downloaded`,
          })

          setIsLoading(false)
          return
        }

        // Try Cloudinary signed
        if (options.cloudinarySigned) {
          console.log("Trying Cloudinary signed download...")
          window.location.href = options.cloudinarySigned

          toast({
            title: "Download started",
            description: `${filename} is being downloaded`,
          })

          setIsLoading(false)
          return
        }

        // Try direct download
        if (options.direct) {
          console.log("Trying direct download...")
          window.location.href = options.direct

          toast({
            title: "Download started",
            description: `${filename} is being downloaded`,
          })

          setIsLoading(false)
          return
        }

        // Try original URL as last resort
        if (options.original) {
          console.log("Trying original URL download...")
          window.location.href = options.original

          toast({
            title: "Download started",
            description: `${filename} is being downloaded`,
          })

          setIsLoading(false)
          return
        }
      }

      // Fallback to the old method if no download options
      if (data.fileUrl) {
        console.log("Falling back to original fileUrl...")
        window.location.href = data.fileUrl

        toast({
          title: "Download started",
          description: `${filename} is being downloaded`,
        })
      } else {
        throw new Error("No download URL available")
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

