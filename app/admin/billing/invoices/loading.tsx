import { Clock } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-2">
        <Clock className="h-8 w-8 animate-spin text-primary" />
        <p>Loading invoices...</p>
      </div>
    </div>
  )
}

