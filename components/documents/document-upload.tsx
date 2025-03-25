"use client"

import type React from "react"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useNotifications } from "@/context/notification-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload } from "lucide-react"

export function DocumentUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const { data: session } = useSession()
  const { addNotification } = useNotifications()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file || !session?.user) return

    setUploading(true)

    try {
      // Simulate file upload
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Add notification for the uploaded document
      addNotification({
        title: "Document Uploaded",
        message: `${file.name} has been successfully uploaded`,
        type: "success",
        link: "/dashboard/documents",
      })

      // Reset form
      setFile(null)

      // Reset file input
      const fileInput = document.getElementById("document-upload") as HTMLInputElement
      if (fileInput) fileInput.value = ""
    } catch (error) {
      console.error("Error uploading document:", error)

      addNotification({
        title: "Upload Failed",
        message: `Failed to upload ${file.name}`,
        type: "error",
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="p-4 border rounded-md">
      <h3 className="font-medium mb-2">Upload Document</h3>
      <div className="flex gap-2">
        <Input id="document-upload" type="file" onChange={handleFileChange} className="flex-1" />
        <Button onClick={handleUpload} disabled={!file || uploading} className="flex items-center gap-1">
          <Upload className="h-4 w-4" />
          {uploading ? "Uploading..." : "Upload"}
        </Button>
      </div>
    </div>
  )
}

