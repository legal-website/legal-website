"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Bug } from "lucide-react"

export function DebugButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [debugData, setDebugData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchDebugData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/debug")
      const data = await response.json()
      setDebugData(data)
    } catch (error) {
      console.error("Error fetching debug data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setIsOpen(true)
          fetchDebugData()
        }}
        className="flex items-center gap-1"
      >
        <Bug className="h-4 w-4" />
        Debug
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Debug Information</DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="py-4 text-center">Loading debug data...</div>
          ) : debugData ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Best Answers ({debugData.bestAnswers?.length || 0})</h3>
                {debugData.bestAnswers?.length > 0 ? (
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="p-2 text-left">ID</th>
                          <th className="p-2 text-left">Post</th>
                          <th className="p-2 text-left">Author</th>
                          <th className="p-2 text-left">Content</th>
                        </tr>
                      </thead>
                      <tbody>
                        {debugData.bestAnswers.map((comment: any) => (
                          <tr key={comment.id} className="border-t">
                            <td className="p-2 font-mono text-xs">{comment.id}</td>
                            <td className="p-2">{comment.post?.title || "Unknown"}</td>
                            <td className="p-2">{comment.author?.name || "Unknown"}</td>
                            <td className="p-2">{comment.content.substring(0, 50)}...</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No best answers found</p>
                )}
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">
                  Moderated Comments ({debugData.moderatedComments?.length || 0})
                </h3>
                {debugData.moderatedComments?.length > 0 ? (
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="p-2 text-left">ID</th>
                          <th className="p-2 text-left">Post</th>
                          <th className="p-2 text-left">Author</th>
                          <th className="p-2 text-left">Moderation Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {debugData.moderatedComments.map((comment: any) => (
                          <tr key={comment.id} className="border-t">
                            <td className="p-2 font-mono text-xs">{comment.id}</td>
                            <td className="p-2">{comment.post?.title || "Unknown"}</td>
                            <td className="p-2">{comment.author?.name || "Unknown"}</td>
                            <td className="p-2">{comment.moderationNotes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No moderated comments found</p>
                )}
              </div>

              <div>
                <h3 className="text-lg font-medium">Raw Debug Data</h3>
                <pre className="bg-muted p-4 rounded-md overflow-auto text-xs">
                  {JSON.stringify(debugData, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center text-muted-foreground">No debug data available</div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

