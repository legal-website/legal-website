"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Bug } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function DebugButton() {
  const [open, setOpen] = useState(false)
  const [debugData, setDebugData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fetchDebugData = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/debug")
      const data = await response.json()
      setDebugData(data)
    } catch (error) {
      console.error("Error fetching debug data:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setOpen(true)
          fetchDebugData()
        }}
      >
        <Bug className="h-4 w-4 mr-1" />
        Debug
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Debug Information</DialogTitle>
            <DialogDescription>
              This shows the current state of best answers and moderation notes in the database.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="py-4 text-center">Loading debug data...</div>
          ) : debugData ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Best Answers ({debugData.bestAnswers?.length || 0})</h3>
                {debugData.bestAnswers?.length > 0 ? (
                  <div className="border rounded overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Post
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Author
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Content
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {debugData.bestAnswers.map((answer: any) => (
                          <tr key={answer.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                              {answer.id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {answer.post?.title || "Unknown"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {answer.author?.name || "Unknown"}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                              {answer.content}...
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No best answers found.</p>
                )}
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">
                  Moderated Comments ({debugData.moderatedComments?.length || 0})
                </h3>
                {debugData.moderatedComments?.length > 0 ? (
                  <div className="border rounded overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Post
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Author
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Moderation Note
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {debugData.moderatedComments.map((comment: any) => (
                          <tr key={comment.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                              {comment.id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {comment.post?.title || "Unknown"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {comment.author?.name || "Unknown"}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                              {comment.moderationNotes}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No moderated comments found.</p>
                )}
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Raw Debug Data</h3>
                <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-xs overflow-auto max-h-60">
                  {JSON.stringify(debugData, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center text-red-500">Failed to load debug data.</div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

