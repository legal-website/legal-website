"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function DebugButton() {
  const [open, setOpen] = useState(false)
  const [debugData, setDebugData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDebugData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/debug/comments")
      const data = await response.json()

      if (data.success) {
        setDebugData(data.data)
      } else {
        setError(data.error || "Failed to fetch debug data")
      }
    } catch (error) {
      console.error("Error fetching debug data:", error)
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpen = () => {
    setOpen(true)
    fetchDebugData()
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleOpen} className="hidden md:flex">
        Debug Comments
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Debug Information</DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="py-4 text-center">Loading debug data...</div>
          ) : error ? (
            <div className="py-4 text-center text-red-500">{error}</div>
          ) : debugData ? (
            <Tabs defaultValue="bestAnswers">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="bestAnswers">Best Answers ({debugData.bestAnswersCount || 0})</TabsTrigger>
                <TabsTrigger value="recentComments">Recent Comments ({debugData.recentCommentsCount || 0})</TabsTrigger>
              </TabsList>

              <TabsContent value="bestAnswers" className="space-y-4">
                {debugData.bestAnswers?.length > 0 ? (
                  <div className="space-y-4">
                    {debugData.bestAnswers.map((comment: any) => (
                      <div key={comment.id} className="border rounded-md p-4">
                        <div className="font-medium">Comment ID: {comment.id}</div>
                        <div className="text-sm mt-1">Author: {comment.author?.name || "Unknown"}</div>
                        <div className="text-sm mt-1">Post: {comment.post?.title || "Unknown"}</div>
                        <div className="text-sm mt-1">Is Best Answer: {comment.isBestAnswer ? "Yes" : "No"}</div>
                        <div className="text-sm mt-1">Moderation Notes: {comment.moderationNotes || "None"}</div>
                        <div className="text-sm mt-2 border-t pt-2">{comment.content}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center">No best answers found</div>
                )}
              </TabsContent>

              <TabsContent value="recentComments" className="space-y-4">
                {debugData.recentComments?.length > 0 ? (
                  <div className="space-y-4">
                    {debugData.recentComments.map((comment: any) => (
                      <div key={comment.id} className="border rounded-md p-4">
                        <div className="font-medium">Comment ID: {comment.id}</div>
                        <div className="text-sm mt-1">Author: {comment.author?.name || "Unknown"}</div>
                        <div className="text-sm mt-1">Is Best Answer: {comment.isBestAnswer ? "Yes" : "No"}</div>
                        <div className="text-sm mt-1">Moderation Notes: {comment.moderationNotes || "None"}</div>
                        <div className="text-sm mt-2 border-t pt-2">{comment.content}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center">No recent comments found</div>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="py-4 text-center">No debug data available</div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

