"use client"

import { formatDistanceToNow } from "date-fns"
import { ThumbsUp, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface Author {
  id: string
  name: string
  avatar: string | null
}

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
}

export default function CommentItem({ comment, onLike }: CommentItemProps) {
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch (error) {
      return dateString
    }
  }

  return (
    <div className="p-4">
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.author.avatar || "/placeholder.svg?height=32&width=32"} alt={comment.author.name} />
          <AvatarFallback>{comment.author.name.substring(0, 2)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium">{comment.author.name}</span>
            <span className="text-xs text-muted-foreground">{formatDate(comment.date)}</span>

            {comment.isBestAnswer && (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 flex items-center gap-1">
                <Award className="h-3 w-3" />
                <span>Best Answer</span>
              </Badge>
            )}
          </div>

          <div className="mb-2">{comment.content}</div>

          {comment.moderationNotes && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-2 mb-2">
              <p className="text-blue-800 dark:text-blue-300 text-sm">
                <span className="font-medium">Moderator note:</span> {comment.moderationNotes}
              </p>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            className={`flex items-center gap-1 ${comment.isLiked ? "text-blue-600" : ""}`}
            onClick={() => onLike(comment.id)}
          >
            <ThumbsUp className="h-4 w-4" />
            <span>{comment.likes}</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

