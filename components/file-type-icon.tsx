import {
    FileText,
    FileImage,
    FileIcon as FilePdf,
    FileCode,
    FileSpreadsheet,
    FileArchive,
    FileAudio,
    FileVideo,
    FileType,
    File,
  } from "lucide-react"
  
  interface FileTypeIconProps {
    fileType?: string
    fileName?: string
    className?: string
    size?: number
  }
  
  export function FileTypeIcon({ fileType, fileName, className = "", size = 20 }: FileTypeIconProps) {
    // Determine file type from extension if fileType is not provided
    const getFileExtension = (filename?: string) => {
      if (!filename) return ""
      return filename.split(".").pop()?.toLowerCase() || ""
    }
  
    const extension = fileType?.toLowerCase() || getFileExtension(fileName)
  
    // Map file extensions to icon components
    const getIconByExtension = (ext?: string) => {
      if (!ext) return <File size={size} className={className} />
  
      // Document types
      if (["pdf"].includes(ext)) return <FilePdf size={size} className={className} />
      if (["doc", "docx", "rtf", "odt"].includes(ext))
        return <FileText size={size} className={`text-blue-600 ${className}`} />
  
      // Spreadsheet types
      if (["xls", "xlsx", "csv", "ods"].includes(ext))
        return <FileSpreadsheet size={size} className={`text-green-600 ${className}`} />
  
      // Image types
      if (["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"].includes(ext))
        return <FileImage size={size} className={`text-purple-600 ${className}`} />
  
      // Code types
      if (["html", "css", "js", "jsx", "ts", "tsx", "json", "xml"].includes(ext))
        return <FileCode size={size} className={`text-yellow-600 ${className}`} />
  
      // Archive types
      if (["zip", "rar", "7z", "tar", "gz"].includes(ext))
        return <FileArchive size={size} className={`text-gray-600 ${className}`} />
  
      // Audio types
      if (["mp3", "wav", "ogg", "flac", "m4a"].includes(ext))
        return <FileAudio size={size} className={`text-red-600 ${className}`} />
  
      // Video types
      if (["mp4", "avi", "mov", "wmv", "flv", "webm"].includes(ext))
        return <FileVideo size={size} className={`text-pink-600 ${className}`} />
  
      // Default
      return <FileType size={size} className={className} />
    }
  
    return getIconByExtension(extension)
  }
  
  