"use client"

import Image from "next/image"
import { Award, AlertCircle, ThumbsUp } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Author {
  id: string
  name: string
  avatar: string
}

interface CommentItemProps {
  id: string
  content: string
  author: Author
  date: string
  likes: number
  isLiked: boolean
  isBestAnswer?: boolean
  moderationNotes?: string | null
  onLike: (commentId: string) => void
}

export function CommentItem({
  id,
  content,
  author,
  date,
  likes,
  isLiked,
  isBestAnswer,
  moderationNotes,
  onLike,
}: CommentItemProps) {
  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return formatDistanceToNow(date, { addSuffix: true })
    } catch (error) {
      return dateString
    }
  }

  return (
    <div className="relative">
      {/* Best Answer Badge - Positioned at the very top */}
      {isBestAnswer && (
        <div className="mb-2 py-1 px-2 bg-yellow-50 border border-yellow-200 rounded-md flex items-center gap-1 w-fit">
          <Award className="h-3.5 w-3.5 text-yellow-600" />
          <span className="text-xs font-medium text-yellow-800">Best Answer</span>
        </div>
      )}

      {/* Moderator Notes - Positioned as a header */}
      {moderationNotes && (
        <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/10 rounded-md border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-1 mb-1">
            <AlertCircle className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Moderator Note:</p>
          </div>
          <p className="text-sm text-blue-700 dark:text-blue-400">{moderationNotes}</p>
        </div>
      )}

      {/* Comment Content */}
      <div className="flex gap-3">
        {/* Fixed size avatar container */}
        <div className="w-8 h-8 flex-shrink-0">
          <Image
            src={author.avatar || "/placeholder.svg?height=32&width=32"}
            alt={author.name}
            width={32}
            height={32}
            className="rounded-full w-full h-full object-cover"
          />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium text-sm">{author.name}</p>
            <span className="text-xs text-gray-500">{formatDate(date)}</span>
          </div>

          <p className="text-gray-700 mb-2">{content}</p>

          <button
            className={`flex items-center gap-1 text-xs ${isLiked ? "text-primary" : "text-gray-500"} hover:text-primary transition-colors`}
            onClick={() => onLike(id)}
          >
            <ThumbsUp className="h-3 w-3" />
            <span>{likes} Likes</span>
          </button>
        </div>
      </div>
    </div>
  )
}

