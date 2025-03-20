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
import { Trash2, MessageSquare, ThumbsUp, TagIcon, Search, RefreshCw } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

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
}

interface CommunityTag {
  id: string
  name: string
  count: number
}

interface User {
  id: string
  name: string
  email: string
  role: string
}

export default function AdminCommunityPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get query params with null checks
  const currentTag = searchParams?.get("tag") || ""
  const currentStatus = searchParams?.get("status") || "pending"
  const currentPage = Number.parseInt(searchParams?.get("page") || "1")
  const currentSearch = searchParams?.get("search") || ""

  // State
  const [posts, setPosts] = useState<Post[]>([])
  const [tags, setTags] = useState<CommunityTag[]>([])
  const [users, setUsers] = useState<User[]>([])
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

  // Fetch posts
  const fetchPosts = async () => {
    try {
      setLoading(true)

      // Build query params
      const params = new URLSearchParams()
      if (selectedStatus) params.append("status", selectedStatus)
      if (selectedTag) params.append("tag", selectedTag)
      if (searchTerm) params.append("search", searchTerm)
      params.append("page", pagination.page.toString())
      params.append("limit", pagination.limit.toString())

      console.log("Fetching posts with params:", params.toString())

      const response = await fetch(`/api/community/posts?${params.toString()}`)
      if (!response.ok) throw new Error("Failed to fetch posts")

      const data = await response.json()
      console.log("Posts data:", data)

      if (data.success) {
        setPosts(data.posts)
        setPagination(data.pagination)
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

  // Fetch users
  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      if (!response.ok) throw new Error("Failed to fetch users")

      const data = await response.json()
      if (data.success) {
        setUsers(data.users)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(`/admin/community?status=${selectedStatus}&tag=${selectedTag}&search=${searchTerm}&page=1`)
  }

  // Handle status change
  const handleStatusChange = (value: string) => {
    setSelectedStatus(value)
    router.push(`/admin/community?status=${value}&tag=${selectedTag}&search=${searchTerm}&page=1`)
  }

  // Handle tag change
  const handleTagChange = (value: string) => {
    setSelectedTag(value)
    router.push(`/admin/community?status=${selectedStatus}&tag=${value}&search=${searchTerm}&page=1`)
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    router.push(`/admin/community?status=${selectedStatus}&tag=${selectedTag}&search=${searchTerm}&page=${page}`)
  }

  // Handle post approval
  const handleApprovePost = async (postId: string) => {
    try {
      const response = await fetch(`/api/community/posts/${postId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "approved" }),
      })

      if (!response.ok) throw new Error("Failed to approve post")

      const data = await response.json()
      if (data.success) {
        toast({
          title: "Success",
          description: "Post approved successfully",
        })
        fetchPosts()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to approve post",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error approving post:", error)
      toast({
        title: "Error",
        description: "Failed to approve post. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle post rejection
  const handleRejectPost = async (postId: string) => {
    try {
      const response = await fetch(`/api/community/posts/${postId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "rejected" }),
      })

      if (!response.ok) throw new Error("Failed to reject post")

      const data = await response.json()
      if (data.success) {
        toast({
          title: "Success",
          description: "Post rejected successfully",
        })
        fetchPosts()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to reject post",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error rejecting post:", error)
      toast({
        title: "Error",
        description: "Failed to reject post. Please try again.",
        variant: "destructive",
      })
    }
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

  // Handle approve all pending posts
  const handleApproveAllPending = async () => {
    if (!confirm("Are you sure you want to approve all pending posts?")) return

    try {
      const response = await fetch("/api/community/fix-posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "approve-all-pending" }),
      })

      if (!response.ok) throw new Error("Failed to approve all pending posts")

      const data = await response.json()
      if (data.success) {
        toast({
          title: "Success",
          description: data.message || "All pending posts approved successfully",
        })
        fetchPosts()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to approve all pending posts",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error approving all pending posts:", error)
      toast({
        title: "Error",
        description: "Failed to approve all pending posts. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Load data on mount and when params change
  useEffect(() => {
    fetchPosts()
    fetchTags()
    fetchUsers()
  }, [searchParams])

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
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Community Management</h1>
        <Button onClick={handleApproveAllPending} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Approve All Pending
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Search */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Search</CardTitle>
              <CardDescription>Search for posts by title or content</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex items-center space-x-2">
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" size="icon" variant="ghost">
                  <Search className="h-4 w-4" />
                  <span className="sr-only">Search</span>
                </Button>
              </form>
            </CardContent>
          </Card>

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
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
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

          {/* Popular Tags */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Popular Tags</CardTitle>
              <CardDescription>Most used tags in the community</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {tags.slice(0, 10).map((tag) => (
                  <Badge key={tag.id} variant="secondary" className="flex items-center gap-1">
                    <TagIcon className="h-3 w-3" />
                    {tag.name} ({tag.count})
                  </Badge>
                ))}
                {tags.length === 0 && <p className="text-sm text-muted-foreground">No tags found</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="md:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedStatus === "all"
                  ? "All Posts"
                  : selectedStatus === "pending"
                    ? "Pending Posts"
                    : selectedStatus === "approved"
                      ? "Approved Posts"
                      : "Rejected Posts"}
              </CardTitle>
              <CardDescription>
                {pagination.total} posts found
                {selectedTag && ` with tag "${selectedTag}"`}
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
                          <h3 className="font-semibold text-lg">{post.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <span>By {post.author.name}</span>
                            <span>•</span>
                            <span>{new Date(post.date).toLocaleDateString()}</span>
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
                          {post.status === "pending" && (
                            <>
                              <Button size="sm" onClick={() => handleApprovePost(post.id)}>
                                Approve
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleRejectPost(post.id)}>
                                Reject
                              </Button>
                            </>
                          )}
                          {post.status === "rejected" && (
                            <Button size="sm" onClick={() => handleApprovePost(post.id)}>
                              Approve
                            </Button>
                          )}
                          {post.status === "approved" && (
                            <Button size="sm" variant="outline" onClick={() => handleRejectPost(post.id)}>
                              Reject
                            </Button>
                          )}
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
                        router.push("/admin/community")
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
    </div>
  )
}

