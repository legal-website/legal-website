"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { ArrowLeft, ThumbsUp, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import CommentItem from "../components/comment-item"

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

interface Post {
  id: string
  title: string
  content: string
  author: Author
  date: string
  likes: number
  comments: number
  isLiked?: boolean
  tags?: { id: string; name: string }[]
}

export default function PostDetail({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showDebug, setShowDebug] = useState(false)

  useEffect(() => {
    // Check if user is admin (this is a simple check, you might want to improve it)
    const checkIfAdmin = async () => {
      try {
        const response = await fetch("/api/auth/me")
        const data = await response.json()
        if (data.success && data.user && data.user.role === "ADMIN") {
          setShowDebug(true)
        }
      } catch (error) {
        console.error("Error checking user role:", error)
      }
    }

    checkIfAdmin()
  }, [])

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`/api/community/posts/${params.id}`)
        const data = await response.json()
        if (data.success) {
          setPost(data.post)
        } else {
          toast({
            title: "Error",
            description: data.error || "Failed to fetch post",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error fetching post:", error)
        toast({
          title: "Error",
          description: "Failed to fetch post",
          variant: "destructive",
        })
      }
    }

    const fetchComments = async () => {
      try {
        console.log("Fetching comments for post:", params.id)
        const response = await fetch(`/api/community/posts/${params.id}/comments`)
        const data = await response.json()
        console.log("Comments API response:", data)

        if (data.success) {
          // Log each comment to debug isBestAnswer and moderationNotes
          data.comments.forEach((comment: any) => {
            console.log(`Comment ${comment.id} from API:`, {
              isBestAnswer: comment.isBestAnswer,
              isBestAnswerType: typeof comment.isBestAnswer,
              moderationNotes: comment.moderationNotes,
              moderationNotesType: typeof comment.moderationNotes,
            })
          })

          // Don't transform the data - use it as is
          setComments(data.comments)
        } else {
          toast({
            title: "Error",
            description: data.error || "Failed to fetch comments",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error fetching comments:", error)
        toast({
          title: "Error",
          description: "Failed to fetch comments",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchPost()
    fetchComments()
  }, [params.id])

  const handleLikePost = async () => {
    if (!post) return

    try {
      const response = await fetch(`/api/community/posts/${post.id}/like`, {
        method: "POST",
      })
      const data = await response.json()
      if (data.success) {
        setPost({
          ...post,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1,
          isLiked: !post.isLiked,
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to like post",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error liking post:", error)
      toast({
        title: "Error",
        description: "Failed to like post",
        variant: "destructive",
      })
    }
  }

  const handleLikeComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/community/comments/${commentId}/like`, {
        method: "POST",
      })
      const data = await response.json()
      if (data.success) {
        setComments(
          comments.map((comment) =>
            comment.id === commentId
              ? {
                  ...comment,
                  likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
                  isLiked: !comment.isLiked,
                }
              : comment,
          ),
        )
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to like comment",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error liking comment:", error)
      toast({
        title: "Error",
        description: "Failed to like comment",
        variant: "destructive",
      })
    }
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/community/posts/${params.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newComment }),
      })
      const data = await response.json()
      if (data.success) {
        setComments([data.comment, ...comments])
        setNewComment("")
        setPost((prev) => (prev ? { ...prev, comments: prev.comments + 1 } : null))
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to submit comment",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error submitting comment:", error)
      toast({
        title: "Error",
        description: "Failed to submit comment",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch (error) {
      return dateString
    }
  }

  if (isLoading) {
    return (
      <div className="container max-w-4xl px-4 sm:px-6 py-4 sm:py-8">
        <div className="flex items-center gap-2 mb-4 sm:mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold">Loading...</h1>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="container max-w-4xl px-4 sm:px-6 py-4 sm:py-8">
        <div className="flex items-center gap-2 mb-4 sm:mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold">Post not found</h1>
        </div>
      </div>
    )
  }

  // Check if there's a best answer among the comments - using Boolean for type safety
  const hasBestAnswer = comments.some((comment) => Boolean(comment.isBestAnswer))

  // Log if we have any best answers
  console.log("Has best answer:", hasBestAnswer)
  if (hasBestAnswer) {
    console.log(
      "Best answer comments:",
      comments.filter((c) => c.isBestAnswer === true),
    )
  }

  return (
    <div className="container max-w-4xl px-4 sm:px-6 py-4 sm:py-8">
      <div className="flex items-center gap-2 mb-4 sm:mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl sm:text-2xl font-bold truncate">{post.title}</h1>
      </div>

      <div className="bg-card rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src={post.author.avatar || "/api/placeholder?height=40&width=40"} alt={post.author.name} />
            <AvatarFallback>{post.author.name.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="font-medium truncate">{post.author.name}</div>
            <div className="text-sm text-muted-foreground">{formatDate(post.date)}</div>
          </div>
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4">
            {post.tags.map((tag) => (
              <Badge key={tag.id} variant="outline">
                {tag.name}
              </Badge>
            ))}
          </div>
        )}

        <div className="prose dark:prose-invert max-w-none mb-4 text-sm sm:text-base break-words">{post.content}</div>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className={`flex items-center gap-1 ${post.isLiked ? "text-blue-600" : ""}`}
            onClick={handleLikePost}
          >
            <ThumbsUp className="h-4 w-4" />
            <span>{post.likes}</span>
          </Button>
          <div className="flex items-center gap-1 text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            <span>{post.comments}</span>
          </div>
        </div>
      </div>

      {/* Display a notice if there's a best answer */}
      {hasBestAnswer && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <p className="text-yellow-800 dark:text-yellow-300 text-sm font-medium">
            This post has a best answer selected by a moderator. Look for the "Best Answer" badge below.
          </p>
        </div>
      )}

      <div className="mb-4 sm:mb-8">
        <h2 className="text-xl font-bold mb-4">Add a Comment</h2>
        <Textarea
          placeholder="Write your comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="mb-4"
        />
        <Button onClick={handleSubmitComment} disabled={isSubmitting || !newComment.trim()}>
          {isSubmitting ? "Submitting..." : "Submit Comment"}
        </Button>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Comments ({comments.length})</h2>
        {comments.length > 0 ? (
          <div className="bg-card rounded-lg shadow-sm divide-y overflow-hidden">
            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} onLike={handleLikeComment} showDebug={showDebug} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
        )}
      </div>
    </div>
  )
}

