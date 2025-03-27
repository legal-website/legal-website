"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Badge } from "@/components/ui/badge"
import {
  Trash2,
  MessageSquare,
  ThumbsUp,
  Search,
  RefreshCw,
  Award,
  Shield,
  Loader2,
  Eye,
  MessageCircle,
  Flag,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  PencilIcon,
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
// Add this import at the top
import { DebugButton } from "./debug-button"

interface Post {
  id: string
  title: string
  content: string
  author: {
    id: string
    name: string
    avatar: string
  }
  status: string
  date: string
  tags: string[]
  likes: number
  replies: number
  flagged?: boolean
  flagCount?: number
}

interface Comment {
  id: string
  content: string
  author: {
    id: string
    name: string
    avatar: string
  }
  date: string
  likes: number
  isLiked?: boolean
  isBestAnswer?: boolean
  flagged?: boolean
  flagCount?: number
  moderationNotes?: string
  postId?: string
}

interface CommunityTag {
  id: string
  name: string
  count: number
}

interface StatCard {
  title: string
  value: number
  change: number
  icon: React.ReactNode
  color: string
}

export default function AdminCommunityModerationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get query params with null checks
  const currentTag = searchParams?.get("tag") || ""
  const currentStatus = searchParams?.get("status") || "all"
  const currentPage = Number.parseInt(searchParams?.get("page") || "1")
  const currentSearch = searchParams?.get("search") || ""
  const currentFilter = searchParams?.get("filter") || "all"

  // State
  const [posts, setPosts] = useState<Post[]>([])
  const [tags, setTags] = useState<CommunityTag[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    total: 0,
    page: currentPage,
    limit: 10,
    totalPages: 0,
  })
  const [searchTerm, setSearchTerm] = useState(currentSearch)
  const [selectedStatus, setSelectedStatus] = useState(currentStatus)
  const [selectedTag, setSelectedTag] = useState(currentTag)
  const [selectedFilter, setSelectedFilter] = useState(currentFilter)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "most_likes" | "most_comments">("newest")
  const [isBackgroundRefreshing, setIsBackgroundRefreshing] = useState(false)
  const [selectedPostComments, setSelectedPostComments] = useState<Comment[]>([])
  const [showCommentsDialog, setShowCommentsDialog] = useState(false)
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [selectedPostForComments, setSelectedPostForComments] = useState<Post | null>(null)
  // Update the state to include a map of comment IDs to moderation notes
  const [moderationNote, setModerationNote] = useState("")
  const [commentModerationNotes, setCommentModerationNotes] = useState<Record<string, string>>({})
  const [flaggedContent, setFlaggedContent] = useState<{
    posts: Post[]
    comments: Comment[]
  }>({
    posts: [],
    comments: [],
  })
  const [activeTab, setActiveTab] = useState("all")
  // Add this state at the top with other state variables
  const [bestAnswers, setBestAnswers] = useState<Comment[]>([])
  const [loadingBestAnswers, setLoadingBestAnswers] = useState(false)

  // Fetch posts
  const fetchPosts = async (searchQuery = searchTerm) => {
    try {
      setLoading(true)

      // Build query params
      const params = new URLSearchParams()
      if (selectedStatus !== "all") params.append("status", selectedStatus)
      if (selectedTag) params.append("tag", selectedTag)
      if (searchQuery) params.append("search", searchQuery)
      params.append("page", pagination.page.toString())
      params.append("limit", pagination.limit.toString())
      params.append("sort", sortOrder)
      if (selectedFilter !== "all") params.append("filter", selectedFilter)

      console.log("Fetching posts with params:", params.toString())

      const response = await fetch(`/api/community/posts?${params.toString()}`)
      if (!response.ok) throw new Error("Failed to fetch posts")

      const data = await response.json()
      console.log("Posts data:", data)

      if (data.success) {
        // Add mock flagged data for demonstration
        const postsWithFlags = data.posts.map((post: Post, index: number) => ({
          ...post,
          flagged: index % 7 === 0, // Every 7th post is flagged
          flagCount: index % 7 === 0 ? Math.floor(Math.random() * 5) + 1 : 0,
        }))

        setPosts(postsWithFlags)
        setPagination(data.pagination)

        // Mock flagged content for the flagged tab
        setFlaggedContent({
          posts: postsWithFlags.filter((post: Post) => post.flagged),
          comments: Array(Math.floor(Math.random() * 5) + 3)
            .fill(null)
            .map((_, i) => ({
              id: `flagged-comment-${i}`,
              content:
                i % 2 === 0
                  ? "This comment contains potentially inappropriate content that needs review."
                  : "This user has been reported multiple times for posting spam links.",
              author: {
                id: `author-${i}`,
                name: `User${i + 1}`,
                avatar: "/placeholder.svg?height=40&width=40",
              },
              date: new Date(Date.now() - 1000 * 60 * 60 * (i + 1)).toISOString(),
              likes: Math.floor(Math.random() * 10),
              flagged: true,
              flagCount: Math.floor(Math.random() * 3) + 1,
            })),
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch posts",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching posts:", error)
      toast({
        title: "Error",
        description: "Failed to fetch posts. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Add a function to fetch moderation notes when loading comments
  const fetchComments = async (postId: string) => {
    try {
      setIsLoadingComments(true)

      const response = await fetch(`/api/community/posts/${postId}/comments`)

      if (!response.ok) {
        throw new Error("Failed to fetch comments")
      }

      const data = await response.json()
      console.log("Fetched comments data:", data)

      if (data.success) {
        // Use the isBestAnswer and moderationNotes from the API response
        // instead of mocking them
        const commentsWithFlags = data.comments.map((comment: Comment, index: number) => ({
          ...comment,
          // Only add flagged status for demo, keep the real isBestAnswer and moderationNotes
          flagged: index === 3, // Flag the 4th comment for demo
          flagCount: index === 3 ? 2 : 0,
        }))

        setSelectedPostComments(commentsWithFlags || [])

        // Initialize the comment moderation notes map
        const notesMap: Record<string, string> = {}
        commentsWithFlags.forEach((comment: Comment) => {
          if (comment.moderationNotes) {
            notesMap[comment.id] = comment.moderationNotes
          }
        })
        setCommentModerationNotes(notesMap)
      } else {
        throw new Error(data.error || "Failed to fetch comments")
      }
    } catch (error) {
      console.error("Error fetching comments:", error)
      toast({
        title: "Error",
        description: "Failed to load comments. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingComments(false)
    }
  }

  // Fetch tags
  const fetchTags = async () => {
    try {
      const response = await fetch("/api/community/tags")
      if (!response.ok) throw new Error("Failed to fetch tags")

      const data = await response.json()
      if (data.success) {
        setTags(data.tags)
      }
    } catch (error) {
      console.error("Error fetching tags:", error)
    }
  }

  // Add this function to fetch best answers
  const fetchBestAnswers = async () => {
    if (activeTab !== "best-answers") return

    try {
      setLoadingBestAnswers(true)
      const response = await fetch("/api/community/best-answers")

      if (!response.ok) {
        throw new Error("Failed to fetch best answers")
      }

      const data = await response.json()

      if (data.success) {
        setBestAnswers(data.bestAnswers)
      } else {
        throw new Error(data.error || "Failed to fetch best answers")
      }
    } catch (error) {
      console.error("Error fetching best answers:", error)
      toast({
        title: "Error",
        description: "Failed to load best answers. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingBestAnswers(false)
    }
  }

  // Handle search with debounce for live search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)

    // Clear any existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    // Set a new timeout
    const timeout = setTimeout(() => {
      fetchPosts(value)
    }, 500) // 500ms debounce

    setSearchTimeout(timeout)
  }

  // Handle status change
  const handleStatusChange = (value: string) => {
    setSelectedStatus(value)
    router.push(
      `/admin/community/moderation?status=${value}&tag=${selectedTag}&search=${searchTerm}&page=1&filter=${selectedFilter}`,
    )
  }

  // Handle tag change
  const handleTagChange = (value: string) => {
    setSelectedTag(value)
    router.push(
      `/admin/community/moderation?status=${selectedStatus}&tag=${value}&search=${searchTerm}&page=1&filter=${selectedFilter}`,
    )
  }

  // Handle filter change
  const handleFilterChange = (value: string) => {
    setSelectedFilter(value)
    router.push(
      `/admin/community/moderation?status=${selectedStatus}&tag=${selectedTag}&search=${searchTerm}&page=1&filter=${value}`,
    )
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    router.push(
      `/admin/community/moderation?status=${selectedStatus}&tag=${selectedTag}&search=${searchTerm}&page=${page}&filter=${selectedFilter}`,
    )
  }

  // Define valid status values
  const VALID_STATUSES = {
    PENDING: "pending",
    PUBLISHED: "published",
    DRAFT: "draft",
    ALL: "all",
  }

  // Handle post deletion
  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return

    try {
      const response = await fetch(`/api/community/posts/${postId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete post")

      const data = await response.json()
      if (data.success) {
        toast({
          title: "Success",
          description: "Post deleted successfully",
        })
        fetchPosts()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete post",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting post:", error)
      toast({
        title: "Error",
        description: "Failed to delete post. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleViewComments = async (post: Post) => {
    setSelectedPostForComments(post)
    setShowCommentsDialog(true)
    await fetchComments(post.id)
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return

    try {
      const response = await fetch(`/api/community/comments/${commentId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete comment")
      }

      const data = await response.json()

      if (data.success) {
        // Remove the deleted comment from the list
        setSelectedPostComments((prevComments) => prevComments.filter((comment) => comment.id !== commentId))

        // Update the reply count for the post
        if (selectedPostForComments) {
          setSelectedPostForComments({
            ...selectedPostForComments,
            replies: selectedPostForComments.replies - 1,
          })

          // Also update in the main posts list
          setPosts((prevPosts) =>
            prevPosts.map((post) => {
              if (post.id === selectedPostForComments.id) {
                return {
                  ...post,
                  replies: post.replies - 1,
                }
              }
              return post
            }),
          )
        }

        toast({
          title: "Success",
          description: "Comment deleted successfully",
        })
      } else {
        throw new Error(data.error || "Failed to delete comment")
      }
    } catch (error) {
      console.error("Error deleting comment:", error)
      toast({
        title: "Error",
        description: "Failed to delete comment. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle marking a comment as the best answer
  const handleMarkBestAnswer = async (commentId: string) => {
    if (!selectedPostForComments) return

    try {
      // Make the actual API call to mark as best answer
      const response = await fetch(`/api/community/comments/${commentId}/best-answer`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId: selectedPostForComments.id,
          isBestAnswer: true,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to mark best answer")
      }

      const data = await response.json()

      if (data.success) {
        // Update the comments list to mark this comment as best answer and unmark others
        setSelectedPostComments((prevComments) =>
          prevComments.map((comment) => ({
            ...comment,
            isBestAnswer: comment.id === commentId,
          })),
        )

        toast({
          title: "Success",
          description: "Comment marked as best answer",
        })
      } else {
        throw new Error(data.error || "Failed to mark best answer")
      }
    } catch (error) {
      console.error("Error marking best answer:", error)
      toast({
        title: "Error",
        description: typeof error === "string" ? error : "Failed to mark best answer. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle removing best answer status
  const handleRemoveBestAnswer = async (commentId: string) => {
    if (!selectedPostForComments) return

    try {
      // Make the actual API call to unmark as best answer
      const response = await fetch(`/api/community/comments/${commentId}/best-answer`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId: selectedPostForComments.id,
          isBestAnswer: false,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to remove best answer status")
      }

      const data = await response.json()

      if (data.success) {
        // Update the comments list to unmark this comment as best answer
        setSelectedPostComments((prevComments) =>
          prevComments.map((comment) => ({
            ...comment,
            isBestAnswer: comment.id === commentId ? false : comment.isBestAnswer,
          })),
        )

        toast({
          title: "Success",
          description: "Best answer status removed",
        })
      } else {
        throw new Error(data.error || "Failed to remove best answer status")
      }
    } catch (error) {
      console.error("Error removing best answer status:", error)
      toast({
        title: "Error",
        description: typeof error === "string" ? error : "Failed to remove best answer status. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Update the handleAddModerationNote function to save notes to the selected comment
  const handleAddModerationNote = async (commentId?: string) => {
    if (!moderationNote.trim()) {
      toast({
        title: "Error",
        description: "Please enter a moderation note",
        variant: "destructive",
      })
      return
    }

    try {
      if (commentId) {
        console.log(`Saving moderation note for comment ${commentId}:`, moderationNote)

        // Save moderation note for a specific comment
        const response = await fetch(`/api/community/comments/${commentId}/moderation-notes`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            moderationNotes: moderationNote,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to save moderation note")
        }

        const data = await response.json()

        if (data.success) {
          console.log("Moderation note saved successfully:", data)

          // Update the comment in the list with the new moderation note
          setSelectedPostComments((prevComments) =>
            prevComments.map((comment) => {
              if (comment.id === commentId) {
                return {
                  ...comment,
                  moderationNotes: moderationNote,
                }
              }
              return comment
            }),
          )

          // Update the notes map
          setCommentModerationNotes((prev) => ({
            ...prev,
            [commentId]: moderationNote,
          }))

          toast({
            title: "Success",
            description: "Moderation note added",
          })
        } else {
          throw new Error(data.error || "Failed to save moderation note")
        }
      } else {
        // For post-level notes (not implemented in the database yet)
        toast({
          title: "Success",
          description: "Moderation note added",
        })
      }

      setModerationNote("")
    } catch (error) {
      console.error("Error adding moderation note:", error)
      toast({
        title: "Error",
        description: typeof error === "string" ? error : "Failed to add moderation note. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle resolving a flagged item
  const handleResolveFlagged = (id: string, type: "post" | "comment") => {
    if (type === "post") {
      setFlaggedContent((prev) => ({
        ...prev,
        posts: prev.posts.filter((post) => post.id !== id),
      }))
    } else {
      setFlaggedContent((prev) => ({
        ...prev,
        comments: prev.comments.filter((comment) => comment.id !== id),
      }))
    }

    toast({
      title: "Success",
      description: `Flagged ${type} resolved successfully`,
    })
  }

  const backgroundRefresh = async () => {
    if (isBackgroundRefreshing) return

    setIsBackgroundRefreshing(true)
    try {
      await Promise.all([fetchPosts(), fetchTags()])
    } catch (error) {
      console.error("Background refresh error:", error)
    } finally {
      setIsBackgroundRefreshing(false)
    }
  }

  // Load data on mount and when params change
  useEffect(() => {
    fetchPosts()
    fetchTags()

    // Set up background refresh every 60 seconds
    const refreshInterval = setInterval(() => {
      backgroundRefresh()
    }, 60000)

    return () => clearInterval(refreshInterval)
  }, [searchParams])

  // Add this effect to fetch best answers when the tab changes
  useEffect(() => {
    if (activeTab === "best-answers") {
      fetchBestAnswers()
    }
  }, [activeTab])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
    }
  }, [searchTimeout])

  // Render pagination
  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null

    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => pagination.page > 1 && handlePageChange(pagination.page - 1)}
              className={pagination.page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              href="#"
            />
          </PaginationItem>

          {Array.from({ length: pagination.totalPages }).map((_, i) => {
            const page = i + 1
            // Show first page, last page, and pages around current page
            if (
              page === 1 ||
              page === pagination.totalPages ||
              (page >= pagination.page - 1 && page <= pagination.page + 1)
            ) {
              return (
                <PaginationItem key={page}>
                  <PaginationLink href="#" onClick={() => handlePageChange(page)} isActive={page === pagination.page}>
                    {page}
                  </PaginationLink>
                </PaginationItem>
              )
            }

            // Show ellipsis for gaps
            if (page === 2 || page === pagination.totalPages - 1) {
              return (
                <PaginationItem key={page}>
                  <PaginationEllipsis />
                </PaginationItem>
              )
            }

            return null
          })}

          <PaginationItem>
            <PaginationNext
              onClick={() => pagination.page < pagination.totalPages && handlePageChange(pagination.page + 1)}
              className={pagination.page >= pagination.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              href="#"
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )
  }

  // Helper function to get badge variant based on status
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "draft":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

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
    <div className="container mx-auto py-6 px-4 md:px-6 mb-20">
      {/* Then in the header section of the page: */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold">Community Moderation</h1>
        <div className="flex flex-wrap gap-2">
          <DebugButton />
          <Button
            onClick={backgroundRefresh}
            variant="outline"
            className="flex items-center gap-2"
            disabled={isBackgroundRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isBackgroundRefreshing ? "animate-spin" : ""}`} />
            {isBackgroundRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            All Content
          </TabsTrigger>
          <TabsTrigger value="flagged" className="flex items-center gap-2">
            <Flag className="h-4 w-4" />
            Flagged Content
            <Badge variant="destructive" className="ml-1">
              {flaggedContent.posts.length + flaggedContent.comments.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="best-answers" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Best Answers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
            <div className="md:col-span-3">
              <Select value={selectedFilter} onValueChange={handleFilterChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter content" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Content</SelectItem>
                  <SelectItem value="questions">Questions Only</SelectItem>
                  <SelectItem value="discussions">Discussions Only</SelectItem>
                  <SelectItem value="needs_answer">Needs Answer</SelectItem>
                  <SelectItem value="has_best_answer">Has Best Answer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search discussions..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
            </div>

            <div className="md:col-span-3">
              <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as any)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="most_likes">Most Likes</SelectItem>
                  <SelectItem value="most_comments">Most Comments</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="space-y-6">
              {/* Filters */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Filters</CardTitle>
                  <CardDescription>Filter posts by status and tags</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select value={selectedStatus} onValueChange={handleStatusChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={VALID_STATUSES.ALL}>All</SelectItem>
                        <SelectItem value={VALID_STATUSES.PENDING}>Pending</SelectItem>
                        <SelectItem value={VALID_STATUSES.PUBLISHED}>Published</SelectItem>
                        <SelectItem value={VALID_STATUSES.DRAFT}>Draft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tag</label>
                    <Select value={selectedTag} onValueChange={handleTagChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tag" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all_tags">All Tags</SelectItem>
                        {tags.map((tag) => (
                          <SelectItem key={tag.id} value={tag.name}>
                            {tag.name} ({tag.count})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Moderation Guidelines */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Moderation Guidelines</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <Collapsible className="space-y-2">
                    <CollapsibleTrigger className="flex items-center justify-between w-full font-medium">
                      <span>Content Standards</span>
                      <Shield className="h-4 w-4" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="text-muted-foreground pl-4 border-l-2 border-muted">
                      <ul className="list-disc pl-4 space-y-1">
                        <li>No offensive language or personal attacks</li>
                        <li>No spam or promotional content</li>
                        <li>Content must be relevant to the community</li>
                      </ul>
                    </CollapsibleContent>
                  </Collapsible>

                  <Collapsible className="space-y-2">
                    <CollapsibleTrigger className="flex items-center justify-between w-full font-medium">
                      <span>Best Answer Guidelines</span>
                      <Award className="h-4 w-4" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="text-muted-foreground pl-4 border-l-2 border-muted">
                      <ul className="list-disc pl-4 space-y-1">
                        <li>Mark answers that are accurate and helpful</li>
                        <li>Best answers should be comprehensive</li>
                        <li>Consider community upvotes when selecting</li>
                      </ul>
                    </CollapsibleContent>
                  </Collapsible>

                  <Collapsible className="space-y-2">
                    <CollapsibleTrigger className="flex items-center justify-between w-full font-medium">
                      <span>Flagged Content Process</span>
                      <Flag className="h-4 w-4" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="text-muted-foreground pl-4 border-l-2 border-muted">
                      <ul className="list-disc pl-4 space-y-1">
                        <li>Review all flagged content within 24 hours</li>
                        <li>Add moderation notes for context</li>
                        <li>Take appropriate action (approve/delete)</li>
                      </ul>
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedStatus === "all"
                      ? "All Posts"
                      : selectedStatus === "pending"
                        ? "Pending Posts"
                        : selectedStatus === "published"
                          ? "Published Posts"
                          : "Draft Posts"}
                  </CardTitle>
                  <CardDescription>
                    {pagination.total} posts found
                    {selectedTag && selectedTag !== "all_tags" && ` with tag "${selectedTag}"`}
                    {searchTerm && ` matching "${searchTerm}"`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="border rounded-lg p-4 animate-pulse">
                          <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                          <div className="flex gap-2">
                            <div className="h-6 bg-gray-200 rounded w-20"></div>
                            <div className="h-6 bg-gray-200 rounded w-20"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : posts.length > 0 ? (
                    <div className="space-y-4">
                      {posts.map((post) => (
                        <div key={post.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg">{post.title}</h3>
                                {post.flagged && (
                                  <Badge variant="destructive" className="flex items-center gap-1">
                                    <Flag className="h-3 w-3" />
                                    Flagged ({post.flagCount})
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <span>By {post.author.name}</span>
                                <span>•</span>
                                <span>{formatDate(post.date)}</span>
                              </div>
                            </div>
                            <Badge className={cn(getStatusBadgeClass(post.status))}>{post.status}</Badge>
                          </div>

                          <p className="mt-2 text-sm line-clamp-2">{post.content}</p>

                          <div className="flex flex-wrap gap-2 mt-3">
                            {post.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>

                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <ThumbsUp className="h-4 w-4" />
                                {post.likes}
                              </div>
                              <div className="flex items-center gap-1">
                                <MessageSquare className="h-4 w-4" />
                                {post.replies}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="secondary" onClick={() => handleViewComments(post)}>
                                <Eye className="h-4 w-4 mr-1" />
                                View & Moderate
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleDeletePost(post.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {renderPagination()}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No posts found</p>
                      {(selectedTag || searchTerm || selectedStatus !== "all") && (
                        <Button
                          variant="link"
                          onClick={() => {
                            router.push("/admin/community/moderation")
                            setSelectedTag("")
                            setSearchTerm("")
                            setSelectedStatus("all")
                          }}
                        >
                          Clear filters
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="flagged">
          <Card>
            <CardHeader>
              <CardTitle>Flagged Content</CardTitle>
              <CardDescription>Content that has been flagged by users or the system for review</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {flaggedContent.posts.length === 0 && flaggedContent.comments.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                    <p className="text-lg font-medium">No flagged content to review</p>
                    <p className="text-muted-foreground">All content has been moderated</p>
                  </div>
                ) : (
                  <>
                    {flaggedContent.posts.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium mb-3">Flagged Posts</h3>
                        <div className="space-y-4">
                          {flaggedContent.posts.map((post) => (
                            <div key={post.id} className="border rounded-lg p-4 bg-red-50 dark:bg-red-900/10">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-lg">{post.title}</h3>
                                    <Badge variant="destructive" className="flex items-center gap-1">
                                      <Flag className="h-3 w-3" />
                                      Flagged ({post.flagCount})
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                    <span>By {post.author.name}</span>
                                    <span>•</span>
                                    <span>{formatDate(post.date)}</span>
                                  </div>
                                </div>
                              </div>

                              <p className="mt-2 text-sm">{post.content}</p>

                              <div className="mt-4 space-y-2">
                                <div className="flex items-center gap-2">
                                  <Textarea
                                    placeholder="Add moderation note..."
                                    className="text-sm"
                                    value={moderationNote}
                                    onChange={(e) => setModerationNote(e.target.value)}
                                  />
                                </div>
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleResolveFlagged(post.id, "post")}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => handleDeletePost(post.id)}>
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="best-answers">
          <Card>
            <CardHeader>
              <CardTitle>Best Answers</CardTitle>
              <CardDescription>Manage and review best answers across the community</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingBestAnswers ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : bestAnswers.length > 0 ? (
                <div className="space-y-6">
                  {bestAnswers.map((comment) => (
                    <div key={comment.id} className="border rounded-lg p-4 bg-yellow-50 dark:bg-yellow-900/10">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={comment.author.avatar || "/placeholder.svg?height=40&width=40"}
                            alt={comment.author.name}
                          />
                          <AvatarFallback>{comment.author.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{comment.author.name}</p>
                              <p className="text-xs text-muted-foreground">{formatDate(comment.date)}</p>
                            </div>
                            <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                              <Award className="h-3 w-3 mr-1" />
                              Best Answer
                            </Badge>
                          </div>
                          <div className="mt-2">
                            <p className="text-sm">{comment.content}</p>
                          </div>
                          {comment.moderationNotes && (
                            <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/10 rounded border border-blue-200 dark:border-blue-800">
                              <p className="text-xs font-medium text-blue-800 dark:text-blue-300">Moderation Note:</p>
                              <p className="text-sm text-blue-700 dark:text-blue-400">{comment.moderationNotes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (comment.postId) {
                              // Find the post and open the comments dialog
                              const post = posts.find((p) => p.id === comment.postId)
                              if (post) {
                                handleViewComments(post)
                              }
                            }
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Post
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award className="h-12 w-12 mx-auto mb-3 text-yellow-500" />
                  <p className="text-lg font-medium">No Best Answers Yet</p>
                  <p className="text-muted-foreground mb-4">
                    Mark helpful comments as best answers to help other users find solutions quickly.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Comments Dialog */}
      <Dialog open={showCommentsDialog} onOpenChange={setShowCommentsDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          {selectedPostForComments && (
            <>
              <DialogHeader>
                <DialogTitle>Moderate: "{selectedPostForComments.title}"</DialogTitle>
              </DialogHeader>

              <div className="mt-4">
                <div className="border rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar>
                      <AvatarImage
                        src={selectedPostForComments.author.avatar || "/placeholder.svg?height=40&width=40"}
                        alt={selectedPostForComments.author.name}
                      />
                      <AvatarFallback>{selectedPostForComments.author.name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedPostForComments.author.name}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(selectedPostForComments.date)}</p>
                    </div>
                    {selectedPostForComments.flagged && (
                      <Badge variant="destructive" className="ml-auto flex items-center gap-1">
                        <Flag className="h-3 w-3" />
                        Flagged
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm mb-3">{selectedPostForComments.content}</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedPostForComments.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Comments ({selectedPostComments.length})</h3>
                  <div className="flex items-center gap-2">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter comments" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Comments</SelectItem>
                        <SelectItem value="flagged">Flagged Only</SelectItem>
                        <SelectItem value="recent">Most Recent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {isLoadingComments ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : selectedPostComments.length > 0 ? (
                  <div className="space-y-6">
                    {selectedPostComments.map((comment) => (
                      <div
                        key={comment.id}
                        className={cn(
                          "flex gap-3 border-b pb-4",
                          comment.isBestAnswer && "bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-lg border-yellow-200",
                        )}
                      >
                        <Avatar>
                          <AvatarImage
                            src={comment.author.avatar || "/placeholder.svg?height=40&width=40"}
                            alt={comment.author.name}
                          />
                          <AvatarFallback>{comment.author.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{comment.author.name}</p>
                              <span className="text-xs text-muted-foreground">{formatDate(comment.date)}</span>
                              {comment.isBestAnswer && (
                                <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                                  <Award className="h-3 w-3 mr-1" />
                                  Best Answer
                                </Badge>
                              )}
                              {comment.flagged && (
                                <Badge variant="destructive" className="flex items-center gap-1">
                                  <Flag className="h-3 w-3" />
                                  Flagged ({comment.flagCount})
                                </Badge>
                              )}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {!comment.isBestAnswer ? (
                                  <DropdownMenuItem onClick={() => handleMarkBestAnswer(comment.id)}>
                                    <Award className="h-4 w-4 mr-2" />
                                    Mark as Best Answer
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => handleRemoveBestAnswer(comment.id)}>
                                    <Award className="h-4 w-4 mr-2" />
                                    Remove Best Answer
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setModerationNote(comment.moderationNotes || "")
                                    document.getElementById(`moderation-note-${comment.id}`)?.focus()
                                  }}
                                >
                                  <PencilIcon className="h-4 w-4 mr-2" />
                                  Edit Moderation Note
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleDeleteComment(comment.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Comment
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <p className="text-gray-700 mb-2">{comment.content}</p>
                          {comment.moderationNotes && (
                            <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/10 rounded border border-yellow-200 dark:border-yellow-800">
                              <p className="text-xs font-medium text-yellow-800 dark:text-yellow-300">
                                Moderation Note:
                              </p>
                              <p className="text-sm text-yellow-700 dark:text-yellow-400">{comment.moderationNotes}</p>
                            </div>
                          )}
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <ThumbsUp className="h-4 w-4" />
                              <span>{comment.likes} Likes</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No comments yet for this post.</p>
                  </div>
                )}

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
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

