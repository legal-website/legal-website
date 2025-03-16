"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Paperclip, X, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void
  maxFiles?: number
  maxSizeMB?: number
  className?: string
}

export function FileUpload({ onFilesSelected, maxFiles = 5, maxSizeMB = 10, className }: FileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newErrors: string[] = []
    const validFiles: File[] = []

    // Check if adding these files would exceed the max files limit
    if (selectedFiles.length + files.length > maxFiles) {
      newErrors.push(`You can only upload a maximum of ${maxFiles} files.`)
    } else {
      // Validate each file
      files.forEach((file) => {
        // Check file size
        if (file.size > maxSizeMB * 1024 * 1024) {
          newErrors.push(`${file.name} exceeds the maximum file size of ${maxSizeMB}MB.`)
        } else {
          validFiles.push(file)
        }
      })
    }

    if (newErrors.length > 0) {
      setErrors(newErrors)
    }

    if (validFiles.length > 0) {
      const newSelectedFiles = [...selectedFiles, ...validFiles]
      setSelectedFiles(newSelectedFiles)
      onFilesSelected(newSelectedFiles)
    }

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeFile = (index: number) => {
    const newFiles = [...selectedFiles]
    newFiles.splice(index, 1)
    setSelectedFiles(newFiles)
    onFilesSelected(newFiles)
    setErrors([])
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " bytes"
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    else return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center"
        >
          <Paperclip className="h-4 w-4 mr-2" />
          Attach Files
        </Button>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple />
        <span className="text-xs text-gray-500">
          Max {maxFiles} files, up to {maxSizeMB}MB each
        </span>
      </div>

      {errors.length > 0 && (
        <div className="text-sm text-red-500">
          {errors.map((error, i) => (
            <p key={i}>{error}</p>
          ))}
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 border rounded-md bg-gray-50 dark:bg-gray-800"
            >
              <div className="flex items-center space-x-2 overflow-hidden">
                <FileText className="h-4 w-4 text-gray-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                className="text-gray-500 hover:text-red-500"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

