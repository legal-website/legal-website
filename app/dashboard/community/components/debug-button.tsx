"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Bug } from "lucide-react"

interface DebugButtonProps {
  commentId: string
}

export default function DebugButton({ commentId }: DebugButtonProps) {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const fetchDebugInfo = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/debug/comments/${commentId}`)
      const data = await response.json()
      setDebugInfo(data)
      setIsOpen(true)
    } catch (error) {
      console.error("Error fetching debug info:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <Button
        variant="outline"
        size="sm"
        onClick={fetchDebugInfo}
        disabled={isLoading}
        className="flex items-center gap-1"
      >
        <Bug className="h-4 w-4" />
        <span>{isLoading ? "Loading..." : "Debug"}</span>
      </Button>

      {isOpen && debugInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-auto">
            <h2 className="text-xl font-bold mb-4">Debug Info</h2>
            <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-auto text-xs">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

