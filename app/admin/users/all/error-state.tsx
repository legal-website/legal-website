"use client"

import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface ErrorStateProps {
  error: string
  onRetry: () => void
}

export default function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <Card className="p-8 text-center">
      <div className="flex flex-col items-center justify-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium mb-2">Error Loading Users</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
        <Button onClick={onRetry}>Try Again</Button>
      </div>
    </Card>
  )
}

