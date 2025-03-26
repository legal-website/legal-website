"use client"

// This is a partial update focusing on the moderation notes section in the dialog

import { useState } from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Award } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

interface Comment {
  id: string
  author: {
    name: string
    avatar: string | null
  }
  content: string
  isBestAnswer: boolean
  moderationNotes?: string
}

interface Props {
  selectedPostComments: Comment[]
}

const CommentSection = ({ selectedPostComments }: Props) => {
  const [commentModerationNotes, setCommentModerationNotes] = useState<{ [key: string]: string }>({})
  const [moderationNote, setModerationNote] = useState<string>("")

  const handleAddModerationNote = (commentId: string) => {
    // Placeholder for adding moderation note logic
    console.log(`Adding moderation note for comment ${commentId}: ${moderationNote}`)
    // In a real implementation, you would likely make an API call to update the comment with the moderation note.
  }

  return (
    <div className="mt-6 space-y-2">
      <h4 className="font-medium">Moderation Notes</h4>
      <div className="space-y-4">
        {selectedPostComments.map((comment) => (
          <div key={comment.id} className="border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="h-6 w-6">
                <AvatarImage
                  src={comment.author.avatar || "/placeholder.svg?height=30&width=30"}
                  alt={comment.author.name}
                />
                <AvatarFallback>{comment.author.name.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <p className="text-sm font-medium">{comment.author.name}</p>
              {comment.isBestAnswer && (
                <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 ml-auto">
                  <Award className="h-3 w-3 mr-1" />
                  Best Answer
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-2 line-clamp-1">{comment.content}</p>
            <div className="flex gap-2">
              <Textarea
                id={`moderation-note-${comment.id}`}
                placeholder="Add moderation note for this comment..."
                className="text-sm"
                value={commentModerationNotes[comment.id] || ""}
                onChange={(e) =>
                  setCommentModerationNotes((prev) => ({
                    ...prev,
                    [comment.id]: e.target.value,
                  }))
                }
              />
              <Button
                size="sm"
                onClick={() => {
                  setModerationNote(commentModerationNotes[comment.id] || "")
                  handleAddModerationNote(comment.id)
                }}
              >
                Save
              </Button>
            </div>
            {comment.moderationNotes && (
              <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/10 rounded border border-yellow-200 dark:border-yellow-800">
                <p className="text-xs font-medium text-yellow-800 dark:text-yellow-300">Current Moderation Note:</p>
                <p className="text-sm text-yellow-700 dark:text-yellow-400">{comment.moderationNotes}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default CommentSection

