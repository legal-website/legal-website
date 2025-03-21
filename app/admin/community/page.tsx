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
  TagIcon,
  Search,
  RefreshCw,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  PenTool,
  Heart,
  MessageCircle,
  Activity,
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

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

interface UserType {
  id: string
  name: string
  email: string
  role: string
}

interface StatCard {
  title: string
  value: number
  change: number
  icon: React.ReactNode
  color: string
}

interface ActivityType {
  id: string
  type: "post" | "comment" | "like"
  user: {
    name: string
    avatar: string
  }
  content: string
  target?: string
  date: string
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
  const [users, setUsers] = useState<UserType[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    total: 0,
    page: currentPage,
    limit: 15, // Changed to 15 as requested
    totalPages: 0,
  })
  const [searchTerm, setSearchTerm] = useState(currentSearch)
  const [selectedStatus, setSelectedStatus] = useState(currentStatus)
  const [selectedTag, setSelectedTag] = useState(currentTag)
  const [stats, setStats] = useState<{
    published: StatCard
    pending: StatCard
    draft: StatCard
    likes: StatCard
    comments: StatCard
  }>({
    published: {
      title: "Published Posts",
      value: 0,
      change: 0,
      icon: <CheckCircle className="h-5 w-5" />,
      color: "bg-green-500",
    },
    pending: {
      title: "Pending Posts",
      value: 0,
      change: 0,
      icon: <Clock className="h-5 w-5" />,
      color: "bg-yellow-500",
    },
    draft: {
      title: "Draft Posts",
      value: 0,
      change: 0,
      icon: <PenTool className="h-5 w-5" />,
      color: "bg-gray-500",
    },
    likes: {
      title: "Total Likes",
      value: 0,
      change: 0,
      icon: <Heart className="h-5 w-5" />,
      color: "bg-red-500",
    },
    comments: {
      title: "Total Comments",
      value: 0,
      change: 0,
      icon: <MessageCircle className="h-5 w-5" />,
      color: "bg-blue-500",
    },
  })
  const [recentActivities, setRecentActivities] = useState<ActivityType[]>([])
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)

  // Fetch posts
  const fetchPosts = async (searchQuery = searchTerm) => {
    try {
      setLoading(true)

      // Build query params
      const params = new URLSearchParams()
      if (selectedStatus) params.append("status", selectedStatus)
      if (selectedTag) params.append("tag", selectedTag)
      if (searchQuery) params.append("search", searchQuery)
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

  // Fetch stats
  const fetchStats = async () => {
    try {
      // This would be a real API call in a production environment
      // For now, we'll simulate with random data
      const response = await fetch("/api/community/stats")

      if (!response.ok) {
        // If the endpoint doesn't exist, use mock data
        const mockStats = {
          published: {
            current: Math.floor(Math.random() * 100) + 50,
            previous: Math.floor(Math.random() * 100) + 40,
          },
          pending: {
            current: Math.floor(Math.random() * 30) + 5,
            previous: Math.floor(Math.random() * 30) + 10,
          },
          draft: {
            current: Math.floor(Math.random() * 40) + 10,
            previous: Math.floor(Math.random() * 40) + 15,
          },
          likes: {
            current: Math.floor(Math.random() * 500) + 200,
            previous: Math.floor(Math.random() * 500) + 180,
          },
          comments: {
            current: Math.floor(Math.random() * 300) + 100,
            previous: Math.floor(Math.random() * 300) + 90,
          },
        }

        setStats({
          published: {
            ...stats.published,
            value: mockStats.published.current,
            change: ((mockStats.published.current - mockStats.published.previous) / mockStats.published.previous) * 100,
          },
          pending: {
            ...stats.pending,
            value: mockStats.pending.current,
            change: ((mockStats.pending.current - mockStats.pending.previous) / mockStats.pending.previous) * 100,
          },
          draft: {
            ...stats.draft,
            value: mockStats.draft.current,
            change: ((mockStats.draft.current - mockStats.draft.previous) / mockStats.draft.previous) * 100,
          },
          likes: {
            ...stats.likes,
            value: mockStats.likes.current,
            change: ((mockStats.likes.current - mockStats.likes.previous) / mockStats.likes.previous) * 100,
          },
          comments: {
            ...stats.comments,
            value: mockStats.comments.current,
            change: ((mockStats.comments.current - mockStats.comments.previous) / mockStats.comments.previous) * 100,
          },
        })
        return
      }

      const data = await response.json()

      if (data.success) {
        setStats({
          published: {
            ...stats.published,
            value: data.stats.published.current,
            change: data.stats.published.percentChange,
          },
          pending: {
            ...stats.pending,
            value: data.stats.pending.current,
            change: data.stats.pending.percentChange,
          },
          draft: {
            ...stats.draft,
            value: data.stats.draft.current,
            change: data.stats.draft.percentChange,
          },
          likes: {
            ...stats.likes,
            value: data.stats.likes.current,
            change: data.stats.likes.percentChange,
          },
          comments: {
            ...stats.comments,
            value: data.stats.comments.current,
            change: data.stats.comments.percentChange,
          },
        })
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
      // Use mock data on error
      const mockChange = () => Math.random() * 20 - 10 // Random between -10 and 10

      setStats({
        published: {
          ...stats.published,
          value: Math.floor(Math.random() * 100) + 50,
          change: mockChange(),
        },
        pending: {
          ...stats.pending,
          value: Math.floor(Math.random() * 30) + 5,
          change: mockChange(),
        },
        draft: {
          ...stats.draft,
          value: Math.floor(Math.random() * 40) + 10,
          change: mockChange(),
        },
        likes: {
          ...stats.likes,
          value: Math.floor(Math.random() * 500) + 200,
          change: mockChange(),
        },
        comments: {
          ...stats.comments,
          value: Math.floor(Math.random() * 300) + 100,
          change: mockChange(),
        },
      })
    }
  }

  // Fetch recent activities
  const fetchRecentActivities = async () => {
    try {
      // This would be a real API call in a production environment
      // For now, we'll simulate with mock data
      const mockActivities: ActivityType[] = [
        {
          id: "1",
          type: "post",
          user: {
            name: "John Doe",
            avatar: "/placeholder.svg?height=40&width=40",
          },
          content: 'Created a new post "Understanding Legal Compliance"',
          date: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        },
        {
          id: "2",
          type: "comment",
          user: {
            name: "Jane Smith",
            avatar: "/placeholder.svg?height=40&width=40",
          },
          content: 'Commented on "Tax Filing Deadlines"',
          target: "Tax Filing Deadlines",
          date: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
        },
        {
          id: "3",
          type: "like",
          user: {
            name: "Robert Johnson",
            avatar: "/placeholder.svg?height=40&width=40",
          },
          content: 'Liked "Business Registration Guide"',
          target: "Business Registration Guide",
          date: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
        },
        {
          id: "4",
          type: "post",
          user: {
            name: "Emily Davis",
            avatar: "/placeholder.svg?height=40&width=40",
          },
          content: 'Created a new post "Annual Report Submission Tips"',
          date: new Date(Date.now() - 1000 * 60 * 240).toISOString(), // 4 hours ago
        },
        {
          id: "5",
          type: "comment",
          user: {
            name: "Michael Wilson",
            avatar: "/placeholder.svg?height=40&width=40",
          },
          content: 'Commented on "LLC vs Corporation"',
          target: "LLC vs Corporation",
          date: new Date(Date.now() - 1000 * 60 * 300).toISOString(), // 5 hours ago
        },
      ]

      setRecentActivities(mockActivities)
    } catch (error) {
      console.error("Error fetching recent activities:", error)
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

  // Define valid status values
  const VALID_STATUSES = {
    PENDING: "pending",
    PUBLISHED: "published",
    DRAFT: "draft",
    ALL: "all",
  }

  // Handle post approval
  const handleApprovePost = async (postId: string) => {
    try {
      const response = await fetch(`/api/community/posts/${postId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: VALID_STATUSES.PUBLISHED }),
      })

      if (!response.ok) throw new Error("Failed to approve post")

      const data = await response.json()
      if (data.success) {
        toast({
          title: "Success",
          description: "Post published successfully",
        })
        fetchPosts()
        fetchStats() // Refresh stats after action
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to publish post",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error publishing post:", error)
      toast({
        title: "Error",
        description: "Failed to publish post. Please try again.",
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
        body: JSON.stringify({ status: VALID_STATUSES.DRAFT }),
      })

      if (!response.ok) throw new Error("Failed to reject post")

      const data = await response.json()
      if (data.success) {
        toast({
          title: "Success",
          description: "Post moved to draft successfully",
        })
        fetchPosts()
        fetchStats() // Refresh stats after action
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to move post to draft",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error moving post to draft:", error)
      toast({
        title: "Error",
        description: "Failed to move post to draft. Please try again.",
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
        fetchStats() // Refresh stats after action
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
    if (!confirm("Are you sure you want to publish all pending posts?")) return

    try {
      const response = await fetch("/api/community/fix-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ approveAll: true }),
      })

      if (!response.ok) throw new Error("Failed to publish all pending posts")

      const data = await response.json()
      if (data.success) {
        toast({
          title: "Success",
          description: data.message || "All pending posts published successfully",
        })
        fetchPosts()
        fetchStats() // Refresh stats after action
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to publish all pending posts",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error publishing all pending posts:", error)
      toast({
        title: "Error",
        description: "Failed to publish all pending posts. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle fix data
  const handleFixData = async (approveAll = false) => {
    try {
      const response = await fetch("/api/community/fix-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ approveAll }),
      })

      if (!response.ok) throw new Error("Failed to fix data")

      const data = await response.json()
      if (data.success) {
        toast({
          title: "Success",
          description: data.message || "Data fixed successfully",
        })
        fetchPosts()
        fetchStats() // Refresh stats after action
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fix data",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fixing data:", error)
      toast({
        title: "Error",
        description: "Failed to fix data. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Debug posts
  const handleDebugPosts = async () => {
    try {
      const response = await fetch("/api/community/debug-posts")
      if (!response.ok) throw new Error("Failed to debug posts")

      const data = await response.json()
      console.log("Debug posts data:", data)

      if (data.success) {
        toast({
          title: "Debug Info",
          description: `Found ${data.rawPosts.length} posts in database. Check console for details.`,
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to debug posts",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error debugging posts:", error)
      toast({
        title: "Error",
        description: "Failed to debug posts. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleCheckStatus = async () => {
    try {
      const response = await fetch("/api/community/status-check")
      if (!response.ok) throw new Error("Failed to check status")

      const data = await response.json()
      if (data.success) {
        console.log("Status check results:", data)

        const statusInfo = Object.entries(data.statusCounts)
          .map(([status, count]) => `${status}: ${count}`)
          .join(", ")

        toast({
          title: "Status Check",
          description: `Found ${data.totalPosts} posts. Status counts: ${statusInfo}`,
        })

        if (data.invalidStatuses.length > 0) {
          toast({
            title: "Invalid Statuses Found",
            description: `Found invalid statuses: ${data.invalidStatuses.join(", ")}. Click "Fix Status Values" to correct.`,
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to check status",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error checking status:", error)
      toast({
        title: "Error",
        description: "Failed to check status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleFixStatus = async () => {
    try {
      const response = await fetch("/api/community/status-check", {
        method: "POST",
      })
      if (!response.ok) throw new Error("Failed to fix status values")

      const data = await response.json()
      if (data.success) {
        console.log("Status fix results:", data)

        const statusInfo = Object.entries(data.statusCounts)
          .map(([status, count]) => `${status}: ${count}`)
          .join(", ")

        toast({
          title: "Status Fixed",
          description: `Fixed post statuses. New counts: ${statusInfo}`,
        })

        fetchPosts()
        fetchStats() // Refresh stats after action
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fix status values",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fixing status:", error)
      toast({
        title: "Error",
        description: "Failed to fix status values. Please try again.",
        variant: "destructive",
      })
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

  // Load data on mount and when params change
  useEffect(() => {
    fetchPosts()
    fetchTags()
    fetchUsers()
    fetchStats()
    fetchRecentActivities()
  }, [searchParams])

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

  // Render stat card
  const renderStatCard = (stat: StatCard) => {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
              <h2 className="text-3xl font-bold">{stat.value.toLocaleString()}</h2>
            </div>
            <div className={`p-2 rounded-full ${stat.color}`}>{stat.icon}</div>
          </div>
          <div className="mt-4 flex items-center">
            {stat.change > 0 ? (
              <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span className={`text-sm ${stat.change > 0 ? "text-green-500" : "text-red-500"}`}>
              {Math.abs(stat.change).toFixed(1)}% from last period
            </span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render activity icon
  const renderActivityIcon = (type: "post" | "comment" | "like") => {
    switch (type) {
      case "post":
        return <FileText className="h-4 w-4 text-blue-500" />
      case "comment":
        return <MessageSquare className="h-4 w-4 text-green-500" />
      case "like":
        return <ThumbsUp className="h-4 w-4 text-red-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-6 mb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold">Community Management</h1>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleDebugPosts} variant="outline" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Debug Posts
          </Button>
          <Button onClick={() => handleFixData(false)} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Fix Data
          </Button>
          <Button onClick={() => handleFixData(true)} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Fix & Approve All
          </Button>
          <Button onClick={handleApproveAllPending} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Approve All Pending
          </Button>
          <Button onClick={handleCheckStatus} variant="outline" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Check Status Values
          </Button>
          <Button onClick={handleFixStatus} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Fix Status Values
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {renderStatCard(stats.published)}
        {renderStatCard(stats.pending)}
        {renderStatCard(stats.draft)}
        {renderStatCard(stats.likes)}
        {renderStatCard(stats.comments)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Search */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Search</CardTitle>
              <CardDescription>Search for posts by title or content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input placeholder="Search..." value={searchTerm} onChange={handleSearchChange} className="pl-9" />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setSearchTerm("")
                    fetchPosts("")
                  }}
                  title="Clear search"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
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

          {/* Recent Activities */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>Latest actions in the community</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="p-2 bg-gray-100 rounded-full">{renderActivityIcon(activity.type)}</div>
                    <div>
                      <p className="text-sm">
                        <span className="font-medium">{activity.user.name}</span> {activity.content}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(activity.date)}</p>
                    </div>
                  </div>
                ))}
                {recentActivities.length === 0 && <p className="text-sm text-muted-foreground">No recent activities</p>}
              </div>
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
                          {post.status === VALID_STATUSES.PENDING && (
                            <>
                              <Button size="sm" onClick={() => handleApprovePost(post.id)}>
                                Publish
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleRejectPost(post.id)}>
                                Move to Draft
                              </Button>
                            </>
                          )}
                          {post.status === VALID_STATUSES.DRAFT && (
                            <Button size="sm" onClick={() => handleApprovePost(post.id)}>
                              Publish
                            </Button>
                          )}
                          {post.status === VALID_STATUSES.PUBLISHED && (
                            <Button size="sm" variant="outline" onClick={() => handleRejectPost(post.id)}>
                              Move to Draft
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

