import { Button } from "@/components/ui/button"
import { FileText, Download } from "lucide-react"

interface TicketAttachmentProps {
  name: string
  size: string
  fileUrl: string
}

export function TicketAttachment({ name, size, fileUrl }: TicketAttachmentProps) {
  return (
    <div className="flex items-center p-2 border rounded-md bg-gray-50 dark:bg-gray-800">
      <FileText className="h-4 w-4 mr-2 text-gray-500" />
      <div className="flex-1 min-w-0">
        <div className="truncate font-medium text-sm">{name}</div>
        <div className="text-xs text-gray-500">{size}</div>
      </div>
      <Button variant="ghost" size="sm" asChild>
        <a href={fileUrl} target="_blank" rel="noopener noreferrer" download>
          <Download className="h-4 w-4 mr-2" />
          Download
        </a>
      </Button>
    </div>
  )
}

