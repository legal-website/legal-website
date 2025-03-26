"use client"

import { formatDistanceToNow } from "date-fns"
import { ThumbsUp, Award, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import DebugButton from "./debug-button"

interface Author {
  id: string
  name: string
  avatar: string | null
}

// Update the comment interface to ensure proper typing
interface Comment {
  id: string
  content: string
  author: Author
  date: string
  likes: number
  isLiked?: boolean
  isBestAnswer?: boolean
  moderationNotes?: string | null
}

interface CommentItemProps {
  comment: Comment
  onLike: (commentId: string) => void
  showDebug?: boolean
}

export default function CommentItem({ comment, onLike, showDebug = false }: CommentItemProps) {
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch (error) {
      return dateString
    }
  }

  // Debug logging to see what we're receiving
  console.log(`Comment ${comment.id} details:`, {
    isBestAnswer: comment.isBestAnswer,
    isBestAnswerType: typeof comment.isBestAnswer,
    moderationNotes: comment.moderationNotes,
    moderationNotesType: typeof comment.moderationNotes,
  })

  // Safely check if isBestAnswer is truthy
  const isBestAnswer = Boolean(comment.isBestAnswer)

  // Safely check if moderationNotes exists and is not empty
  const hasModeratorNotes = Boolean(
    comment.moderationNotes && comment.moderationNotes !== "null" && comment.moderationNotes !== "",
  )

  // Replace the existing return statement with this updated version that properly handles the values
  return (
    <div className="flex gap-4 py-4 px-6 border-b last:border-0">
      <Avatar className="h-10 w-10">
        <AvatarImage src={comment.author.avatar || "/api/placeholder?height=40&width=40"} alt={comment.author.name} />
        <AvatarFallback>{comment.author.name.substring(0, 2)}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{comment.author.name}</span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">{formatDate(comment.date)}</span>
          </div>

          {isBestAnswer && (
            <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 flex items-center gap-1">
              <Award className="h-3 w-3" />
              <span>Best Answer</span>
            </Badge>
          )}
        </div>

        {/* Moderator notes ABOVE the comment content */}
        {hasModeratorNotes && (
          <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/10 rounded border border-blue-200 dark:border-blue-800">
            <p className="text-xs font-medium text-blue-800 dark:text-blue-300 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Moderator Note:
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-400">{comment.moderationNotes}</p>
          </div>
        )}

        <p className="text-sm">{comment.content}</p>

        <div className="mt-2 flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className={`flex items-center gap-1 ${comment.isLiked ? "text-blue-600" : ""}`}
            onClick={() => onLike(comment.id)}
          >
            <ThumbsUp className="h-4 w-4" />
            <span>{comment.likes}</span>
          </Button>

          {showDebug && <DebugButton commentId={comment.id} />}
        </div>
      </div>
    </div>
  )
}

