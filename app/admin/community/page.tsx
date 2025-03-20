"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { format, formatDistanceToNow } from "date-fns"
import Image from "next/image"
import {
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  MessageCircle,
  ThumbsUp,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Loader2,
  AlertCircle,
  Send,
  Clock,
  User,
  FileText,
  MessageSquare,
} from "lucide-react"

// Import Role from our own file instead of @prisma/client
import { Role } from "@/lib/role"

interface Author {
  id: string
  name: string
  avatar: string
}

interface Post {
  id: string
  title: string
  content: string
  author: Author
  date: string
  tags: string[]
  likes: number
  replies: number
  isLiked: boolean
  status: string
}

interface Comment {
  id: string
  content: string
  author: Author
  date: string
  likes: number
  isLiked: boolean
}

interface TagWithCount {
  id: string
  name: string
  count: number
}

interface UserData {
  id: string
  name: string
  email: string
  role: Role
  profileImage?: string
}

export default function AdminCommunityPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState("pending")
  const [posts, setPosts] = useState<Post[]>([])
  const [allTags, setAllTags] = useState<TagWithCount[]>([])
  const [users, setUsers] = useState<UserData[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [postComments, setPostComments] = useState<Comment[]>([])
  const [showPostDialog, setShowPostDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [editPostData, setEditPostData] = useState({
    title: "",
    content: "",
    tags: "",
    status: "",
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalPosts, setTotalPosts] = useState(0)
  const [postsPerPage] = useState(10)
  const [isProcessing, setIsProcessing] = useState(false)
  const [communityStats, setCommunityStats] = useState({
    totalPosts: 0,
    totalComments: 0,
    totalLikes: 0,
    pendingPosts: 0,
    activeTags: 0,
    mostActiveUsers: [] as { id: string; name: string; postCount: number }[],
  })

  // Check if user is authenticated and is an admin
  useEffect(() => {
    if (sessionStatus === "loading") return

    if (!session) {
      router.push("/login?callbackUrl=/admin/community")
      return
    }

    // Only ADMIN users can access this page
    if ((session.user as any).role !== Role.ADMIN) {
      router.push("/dashboard")
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      })
    }
  }, [session, sessionStatus, router, toast])

  // Add this at the top of the file, after the imports
  useEffect(() => {
    const logFetchResults = async () => {
      try {
        const response = await fetch("/api/community/posts?status=all")
        const data = await response.json()
        console.log("Admin fetch posts response:", data)
      } catch (error) {
        console.error("Error logging fetch results:", error)
      }
    }

    if (sessionStatus === "authenticated" && (session?.user as any)?.role === Role.ADMIN) {
      logFetchResults()
    }
  }, [sessionStatus, session])

  // Fetch posts
  const fetchPosts = useCallback(async () => {
    if (sessionStatus !== "authenticated" || (session?.user as any)?.role !== Role.ADMIN) return

    try {
      setIsLoading(true)
      setError(null)

      const queryParams = new URLSearchParams()
      if (searchQuery) queryParams.set("search", searchQuery)
      if (selectedTag) queryParams.set("tag", selectedTag)
      queryParams.set("status", activeTab === "all" ? "all" : activeTab)
      queryParams.set("page", currentPage.toString())
      queryParams.set("limit", postsPerPage.toString())

      console.log(`Admin fetching posts with params: ${queryParams.toString()}`)
      const response = await fetch(`/api/community/posts?${queryParams.toString()}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Admin fetch posts response:", data)

      if (data.success) {
        setPosts(data.posts)
        setTotalPages(data.pagination.totalPages)
        setTotalPosts(data.pagination.total)
      } else {
        throw new Error(data.error || "Failed to fetch posts")
      }
    } catch (error) {
      console.error("Error fetching posts:", error)
      setError("Failed to load posts. Please try again.")
      toast({
        title: "Error",
        description: "Failed to load posts. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, selectedTag, activeTab, currentPage, postsPerPage, sessionStatus, session, toast])

  // Fetch tags
  const fetchTags = useCallback(async () => {
    if (sessionStatus !== "authenticated" || (session?.user as any)?.role !== Role.ADMIN) return

    try {
      const response = await fetch("/api/community/tags")

      if (!response.ok) {
        throw new Error("Failed to fetch tags")
      }

      const data = await response.json()

      if (data.success) {
        setAllTags(data.tags)
      }
    } catch (error) {
      console.error("Error fetching tags:", error)
    }
  }, [sessionStatus, session])

  // Fetch users
  const fetchUsers = useCallback(async () => {
    if (sessionStatus !== "authenticated" || (session?.user as any)?.role !== Role.ADMIN) return

    try {
      const response = await fetch("/api/admin/users")

      if (!response.ok) {
        throw new Error("Failed to fetch users")
      }

      const data = await response.json()

      if (data.users) {
        setUsers(
          data.users.map((user: any) => ({
            id: user.id,
            name: user.name || "Unknown",
            email: user.email,
            role: user.role,
            profileImage: user.profileImage || user.image,
          })),
        )
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }, [sessionStatus, session])

  // Fetch community stats
  const fetchCommunityStats = useCallback(async () => {
    if (sessionStatus !== "authenticated" || (session?.user as any)?.role !== Role.ADMIN) return

    try {
      // This would be a real API endpoint in a production app
      // For now, we'll simulate some stats
      setCommunityStats({
        totalPosts: 125,
        totalComments: 843,
        totalLikes: 1256,
        pendingPosts: posts.filter((p) => p.status === "pending").length,
        activeTags: allTags.length,
        mostActiveUsers: users.slice(0, 5).map((user) => ({
          id: user.id,
          name: user.name,
          postCount: Math.floor(Math.random() * 20) + 1,
        })),
      })
    } catch (error) {
      console.error("Error fetching community stats:", error)
    }
  }, [sessionStatus, session, posts, allTags, users])

  // Fetch post comments
  const fetchComments = useCallback(
    async (postId: string) => {
      if (sessionStatus !== "authenticated" || (session?.user as any)?.role !== Role.ADMIN) return

      try {
        setIsLoadingComments(true)

        const response = await fetch(`/api/community/posts/${postId}/comments`)

        if (!response.ok) {
          throw new Error("Failed to fetch comments")
        }

        const data = await response.json()

        if (data.success) {
          setPostComments(data.comments)
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
    },
    [sessionStatus, session, toast],
  )

  // Initial data fetch
  useEffect(() => {
    if (sessionStatus === "authenticated" && (session?.user as any)?.role === Role.ADMIN) {
      fetchPosts()
      fetchTags()
      fetchUsers()
    }
  }, [fetchPosts, fetchTags, fetchUsers, sessionStatus, session])

  // Update community stats when data changes
  useEffect(() => {
    if (sessionStatus === "authenticated" && (session?.user as any)?.role === Role.ADMIN) {
      fetchCommunityStats()
    }
  }, [fetchCommunityStats, posts, allTags, users, sessionStatus, session])

  // Handle view post
  const handleViewPost = async (post: Post) => {
    setSelectedPost(post)
    setShowPostDialog(true)
    await fetchComments(post.id)
  }

  // Handle edit post
  const handleEditPost = (post: Post) => {
    setSelectedPost(post)
    setEditPostData({
      title: post.title,
      content: post.content,
      tags: post.tags.join(", "),
      status: post.status,
    })
    setShowEditDialog(true)
  }

  // Handle delete post
  const handleDeletePost = (post: Post) => {
    setSelectedPost(post)
    setShowDeleteDialog(true)
  }

  // Handle submit comment
  const handleSubmitComment = async () => {
    if (!selectedPost) return

    if (sessionStatus !== "authenticated") {
      return
    }

    if (!newComment.trim()) {
      toast({
        title: "Error",
        description: "Comment cannot be empty.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmittingComment(true)

      const response = await fetch(`/api/community/posts/${selectedPost.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newComment,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit comment")
      }

      const data = await response.json()

      if (data.success) {
        // Add new comment to the list
        setPostComments((prev) => [data.comment, ...prev])

        // Update post reply count
        setPosts((prevPosts) =>
          prevPosts.map((post) => {
            if (post.id === selectedPost.id) {
              return {
                ...post,
                replies: post.replies + 1,
              }
            }
            return post
          }),
        )

        if (selectedPost) {
          setSelectedPost({
            ...selectedPost,
            replies: selectedPost.replies + 1,
          })
        }

        // Reset form
        setNewComment("")

        toast({
          title: "Success",
          description: "Your comment has been posted.",
        })
      } else {
        throw new Error(data.error || "Failed to submit comment")
      }
    } catch (error) {
      console.error("Error submitting comment:", error)
      toast({
        title: "Error",
        description: "Failed to submit comment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingComment(false)
    }
  }

  // Handle update post status
  const handleUpdatePostStatus = async (postId: string, newStatus: string) => {
    try {
      setIsProcessing(true)

      const response = await fetch(`/api/community/posts/${postId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update post status")
      }

      const data = await response.json()

      if (data.success) {
        // Update posts state
        setPosts((prevPosts) =>
          prevPosts.map((post) => {
            if (post.id === postId) {
              return {
                ...post,
                status: newStatus,
              }
            }
            return post
          }),
        )

        // If the post is currently selected, update it too
        if (selectedPost?.id === postId) {
          setSelectedPost((prev) => {
            if (prev) {
              return {
                ...prev,
                status: newStatus,
              }
            }
            return prev
          })
        }

        toast({
          title: "Success",
          description: `Post has been ${newStatus === "approved" ? "approved" : "rejected"}.`,
        })
      } else {
        throw new Error(data.error || "Failed to update post status")
      }
    } catch (error) {
      console.error("Error updating post status:", error)
      toast({
        title: "Error",
        description: "Failed to update post status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle save edited post
  const handleSaveEditedPost = async () => {
    if (!selectedPost) return

    try {
      setIsProcessing(true)

      // Process tags
      const tags = editPostData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)

      const response = await fetch(`/api/community/posts/${selectedPost.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editPostData.title,
          content: editPostData.content,
          status: editPostData.status,
          tags,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update post")
      }

      const data = await response.json()

      if (data.success) {
        // Update posts state
        setPosts((prevPosts) =>
          prevPosts.map((post) => {
            if (post.id === selectedPost.id) {
              return {
                ...post,
                title: editPostData.title,
                content: editPostData.content,
                status: editPostData.status,
                tags,
              }
            }
            return post
          }),
        )

        // If the post is currently selected, update it too
        if (selectedPost) {
          setSelectedPost({
            ...selectedPost,
            title: editPostData.title,
            content: editPostData.content,
            status: editPostData.status,
            tags,
          })
        }

        setShowEditDialog(false)
        toast({
          title: "Success",
          description: "Post has been updated successfully.",
        })
      } else {
        throw new Error(data.error || "Failed to update post")
      }
    } catch (error) {
      console.error("Error updating post:", error)
      toast({
        title: "Error",
        description: "Failed to update post. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle confirm delete post
  const handleConfirmDeletePost = async () => {
    if (!selectedPost) return

    try {
      setIsProcessing(true)

      const response = await fetch(`/api/community/posts/${selectedPost.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete post")
      }

      const data = await response.json()

      if (data.success) {
        // Remove post from state
        setPosts((prevPosts) => prevPosts.filter((post) => post.id !== selectedPost.id))

        setShowDeleteDialog(false)
        setShowPostDialog(false)

        toast({
          title: "Success",
          description: "Post has been deleted successfully.",
        })
      } else {
        throw new Error(data.error || "Failed to delete post")
      }
    } catch (error) {
      console.error("Error deleting post:", error)
      toast({
        title: "Error",
        description: "Failed to delete post. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
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

  // Format full date
  const formatFullDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, "PPP p")
    } catch (error) {
      return dateString
    }
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  // If user is not an admin, don't render the page
  if (sessionStatus === "authenticated" && (session?.user as any)?.role !== Role.ADMIN) {
    return null
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto mb-40">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Community Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage community posts, comments, and moderation</p>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Posts</p>
                <p className="text-3xl font-bold">{communityStats.totalPosts}</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-full">
                <FileText className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Comments</p>
                <p className="text-3xl font-bold">{communityStats.totalComments}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <MessageCircle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Likes</p>
                <p className="text-3xl font-bold">{communityStats.totalLikes}</p>
              </div>
              <div className="p-2 bg-red-100 rounded-full">
                <ThumbsUp className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Posts</p>
                <p className="text-3xl font-bold">{communityStats.pendingPosts}</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Community Posts</CardTitle>
              <CardDescription>Manage and moderate community discussions</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters and Search */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search posts..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          fetchPosts()
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select
                    value={selectedTag || ""}
                    onValueChange={(value) => {
                      setSelectedTag(value || null)
                      setCurrentPage(1)
                      setTimeout(() => fetchPosts(), 0)
                    }}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by tag" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tags</SelectItem>
                      {allTags.map((tag) => (
                        <SelectItem key={tag.id} value={tag.name}>
                          {tag.name} ({tag.count})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setSearchQuery("")
                      setSelectedTag(null)
                      setCurrentPage(1)
                      setTimeout(() => fetchPosts(), 0)
                    }}
                    title="Clear filters"
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Tabs */}
              <Tabs
                value={activeTab}
                onValueChange={(value) => {
                  setActiveTab(value)
                  setCurrentPage(1)
                  setTimeout(() => fetchPosts(), 0)
                }}
                className="mb-6"
              >
                <TabsList>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="approved">Approved</TabsTrigger>
                  <TabsTrigger value="rejected">Rejected</TabsTrigger>
                  <TabsTrigger value="all">All Posts</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Posts Table */}
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Error loading posts</h3>
                  <p className="text-muted-foreground mb-4">{error}</p>
                  <Button onClick={fetchPosts} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No posts found</h3>
                  <p className="text-muted-foreground">
                    {activeTab === "pending"
                      ? "There are no pending posts to review."
                      : "No posts match your current filters."}
                  </p>
                </div>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Author</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Engagement</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {posts.map((post) => (
                          <TableRow key={post.id}>
                            <TableCell className="font-medium">
                              <div className="cursor-pointer hover:text-primary" onClick={() => handleViewPost(post)}>
                                {post.title.length > 50 ? `${post.title.substring(0, 50)}...` : post.title}
                              </div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {post.tags.slice(0, 3).map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {post.tags.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{post.tags.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                  {post.author.avatar ? (
                                    <Image
                                      src={post.author.avatar || "/placeholder.svg"}
                                      alt={post.author.name}
                                      width={32}
                                      height={32}
                                      className="object-cover"
                                    />
                                  ) : (
                                    <User className="h-4 w-4 text-gray-500" />
                                  )}
                                </div>
                                <span>{post.author.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(post.status)}</TableCell>
                            <TableCell>
                              <div className="text-sm text-muted-foreground" title={formatFullDate(post.date)}>
                                {formatDate(post.date)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1" title="Likes">
                                  <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                                  <span>{post.likes}</span>
                                </div>
                                <div className="flex items-center gap-1" title="Comments">
                                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                                  <span>{post.replies}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleViewPost(post)} title="View">
                                  <Eye className="h-4 w-4" />
                                </Button>

                                {post.status === "pending" && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleUpdatePostStatus(post.id, "approved")}
                                      title="Approve"
                                      className="text-green-600"
                                      disabled={isProcessing}
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleUpdatePostStatus(post.id, "rejected")}
                                      title="Reject"
                                      className="text-red-600"
                                      disabled={isProcessing}
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}

                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => handleViewPost(post)}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleEditPost(post)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit Post
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleDeletePost(post)} className="text-red-600">
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete Post
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-6">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              href="#"
                              onClick={(e) => {
                                e.preventDefault()
                                if (currentPage > 1) {
                                  setCurrentPage(currentPage - 1)
                                }
                              }}
                              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>

                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                            // Show first page, last page, and pages around current page
                            if (
                              page === 1 ||
                              page === totalPages ||
                              (page >= currentPage - 1 && page <= currentPage + 1)
                            ) {
                              return (
                                <PaginationItem key={page}>
                                  <PaginationLink
                                    href="#"
                                    isActive={page === currentPage}
                                    onClick={(e) => {
                                      e.preventDefault()
                                      setCurrentPage(page)
                                    }}
                                  >
                                    {page}
                                  </PaginationLink>
                                </PaginationItem>
                              )
                            }

                            // Show ellipsis for gaps
                            if (
                              (page === 2 && currentPage > 3) ||
                              (page === totalPages - 1 && currentPage < totalPages - 2)
                            ) {
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
                              href="#"
                              onClick={(e) => {
                                e.preventDefault()
                                if (currentPage < totalPages) {
                                  setCurrentPage(currentPage + 1)
                                }
                              }}
                              className={
                                currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"
                              }
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Community Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active Tags</span>
                  <span className="font-medium">{communityStats.activeTags}</span>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Most Active Users</div>
                  <div className="space-y-2">
                    {communityStats.mostActiveUsers.map((user) => (
                      <div key={user.id} className="flex justify-between items-center">
                        <span className="text-sm">{user.name}</span>
                        <Badge variant="outline">{user.postCount} posts</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Popular Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {allTags.slice(0, 10).map((tag) => (
                  <Badge
                    key={tag.id}
                    variant={selectedTag === tag.name ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedTag(selectedTag === tag.name ? null : tag.name)
                      setCurrentPage(1)
                      setTimeout(() => fetchPosts(), 0)
                    }}
                  >
                    {tag.name} ({tag.count})
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Moderation Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="rounded-full bg-green-100 p-1 mt-0.5">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  </div>
                  <span>Approve posts that are relevant and follow community guidelines</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="rounded-full bg-red-100 p-1 mt-0.5">
                    <XCircle className="h-3 w-3 text-red-600" />
                  </div>
                  <span>Reject spam, offensive content, or irrelevant posts</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="rounded-full bg-blue-100 p-1 mt-0.5">
                    <MessageCircle className="h-3 w-3 text-blue-600" />
                  </div>
                  <span>Engage with users by commenting on their posts</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Post Detail Dialog */}
      <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          {selectedPost && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>{selectedPost.title}</span>
                  {getStatusBadge(selectedPost.status)}
                </DialogTitle>
                <DialogDescription>
                  Posted by {selectedPost.author.name} • {formatFullDate(selectedPost.date)}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                <div className="mb-6">
                  <p className="text-gray-700 whitespace-pre-line">{selectedPost.content}</p>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {selectedPost.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center gap-4 mb-8 border-t border-b py-3">
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <ThumbsUp className="h-4 w-4" />
                    <span>{selectedPost.likes} Likes</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <MessageCircle className="h-4 w-4" />
                    <span>{selectedPost.replies} Comments</span>
                  </div>
                </div>

                {selectedPost.status === "pending" && (
                  <div className="flex items-center gap-3 mb-6">
                    <Button
                      onClick={() => handleUpdatePostStatus(selectedPost.id, "approved")}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve Post
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleUpdatePostStatus(selectedPost.id, "rejected")}
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject Post
                        </>
                      )}
                    </Button>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-4">Comments ({selectedPost.replies})</h3>

                  <div className="flex gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      {session?.user?.image ? (
                        <Image
                          src={session.user.image || "/placeholder.svg"}
                          alt={session.user.name || "Admin"}
                          width={40}
                          height={40}
                          className="object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <Textarea
                        placeholder="Add a comment as admin..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        rows={2}
                        className="mb-2"
                      />
                      <div className="flex justify-end">
                        <Button onClick={handleSubmitComment} disabled={isSubmittingComment} size="sm">
                          {isSubmittingComment ? (
                            <>
                              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                              Posting...
                            </>
                          ) : (
                            <>
                              <Send className="mr-2 h-3 w-3" />
                              Post Comment
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {isLoadingComments ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : postComments.length > 0 ? (
                    <div className="space-y-6">
                      {postComments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                            {comment.author.avatar ? (
                              <Image
                                src={comment.author.avatar || "/placeholder.svg"}
                                alt={comment.author.name}
                                width={32}
                                height={32}
                                className="object-cover"
                              />
                            ) : (
                              <User className="h-4 w-4 text-gray-500" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">{comment.author.name}</p>
                              <span className="text-xs text-gray-500">{formatDate(comment.date)}</span>
                            </div>
                            <p className="text-gray-700 mb-2">{comment.content}</p>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <ThumbsUp className="h-3 w-3" />
                              <span>{comment.likes} Likes</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No comments yet.</p>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowPostDialog(false)}>
                    Close
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPostDialog(false)
                      handleEditPost(selectedPost)
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Post
                  </Button>
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => {
                      setShowPostDialog(false)
                      handleDeletePost(selectedPost)
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Post
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Post Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
            <DialogDescription>Make changes to the post content and settings</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editPostData.title}
                onChange={(e) => setEditPostData({ ...editPostData, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-content">Content</Label>
              <Textarea
                id="edit-content"
                value={editPostData.content}
                onChange={(e) => setEditPostData({ ...editPostData, content: e.target.value })}
                rows={5}
              />
            </div>
            <div>
              <Label htmlFor="edit-tags">Tags (separated by commas)</Label>
              <Input
                id="edit-tags"
                value={editPostData.tags}
                onChange={(e) => setEditPostData({ ...editPostData, tags: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={editPostData.status}
                onValueChange={(value) => setEditPostData({ ...editPostData, status: value })}
              >
                <SelectTrigger id="edit-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEditedPost} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Post Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone and will remove all associated
              comments and likes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeletePost}
              className="bg-red-600 hover:bg-red-700"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Post"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

