"use client"

import { Label } from "@/components/ui/label"
import Image from "next/image"
import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  MessageCircle,
  Search,
  ThumbsUp,
  MessageSquare,
  Clock,
  Tag,
  Filter,
  PlusCircle,
  Share2,
  Facebook,
  Twitter,
  Linkedin,
  Send,
  Loader2,
  RefreshCw,
  AlertCircle,
} from "lucide-react"
import { useSession } from "next-auth/react"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
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

// Add this at the top of the file, after the imports

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
  status?: string
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

export default function CommunityPage() {
  const { data: session, status: sessionStatus } = useSession()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [newPostTitle, setNewPostTitle] = useState("")
  const [newPostContent, setNewPostContent] = useState("")
  const [newPostTags, setNewPostTags] = useState("")
  const [posts, setPosts] = useState<Post[]>([])
  const [allTags, setAllTags] = useState<TagWithCount[]>([])
  const [activeTab, setActiveTab] = useState("latest")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showNewPostDialog, setShowNewPostDialog] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [postComments, setPostComments] = useState<Comment[]>([])
  const [showPostDialog, setShowPostDialog] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [shareUrl, setShareUrl] = useState("")
  const [error, setError] = useState<string | null>(null)

  // Inside the CommunityPage component, add this useEffect to log the fetch results
  useEffect(() => {
    const logFetchResults = async () => {
      try {
        const response = await fetch("/api/community/posts?status=all")
        const data = await response.json()
        console.log("Fetch posts response:", data)
      } catch (error) {
        console.error("Error logging fetch results:", error)
      }
    }

    logFetchResults()
  }, [])

  // Fetch posts
  const fetchPosts = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const queryParams = new URLSearchParams()
      if (searchQuery) queryParams.set("search", searchQuery)
      if (selectedTag) queryParams.set("tag", selectedTag)
      queryParams.set("sort", activeTab)

      console.log(`Fetching posts with params: ${queryParams.toString()}`)
      const response = await fetch(`/api/community/posts?${queryParams.toString()}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Fetch posts response:", data)

      if (data.success) {
        setPosts(data.posts)
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
  }, [searchQuery, selectedTag, activeTab, toast])

  // Fetch tags
  const fetchTags = useCallback(async () => {
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
  }, [])

  // Fetch post comments
  const fetchComments = useCallback(
    async (postId: string) => {
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
    [toast],
  )

  // Initial data fetch
  useEffect(() => {
    fetchPosts()
    fetchTags()
  }, [fetchPosts, fetchTags])

  // Handle like post
  const handleLikePost = async (postId: string) => {
    if (sessionStatus !== "authenticated") {
      setShowLoginPrompt(true)
      return
    }

    try {
      const response = await fetch("/api/community/likes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ postId }),
      })

      if (!response.ok) {
        throw new Error("Failed to like post")
      }

      const data = await response.json()

      // Update posts state
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              likes: data.liked ? post.likes + 1 : post.likes - 1,
              isLiked: data.liked,
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
              likes: data.liked ? prev.likes + 1 : prev.likes - 1,
              isLiked: data.liked,
            }
          }
          return prev
        })
      }
    } catch (error) {
      console.error("Error liking post:", error)
      toast({
        title: "Error",
        description: "Failed to like post. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle like comment
  const handleLikeComment = async (commentId: string) => {
    if (sessionStatus !== "authenticated") {
      setShowLoginPrompt(true)
      return
    }

    try {
      const response = await fetch("/api/community/likes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ commentId }),
      })

      if (!response.ok) {
        throw new Error("Failed to like comment")
      }

      const data = await response.json()

      // Update comments state
      setPostComments((prevComments) =>
        prevComments.map((comment) => {
          if (comment.id === commentId) {
            return {
              ...comment,
              likes: data.liked ? comment.likes + 1 : comment.likes - 1,
              isLiked: data.liked,
            }
          }
          return comment
        }),
      )
    } catch (error) {
      console.error("Error liking comment:", error)
      toast({
        title: "Error",
        description: "Failed to like comment. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle create post
  const handleCreatePost = async () => {
    if (sessionStatus !== "authenticated") {
      setShowLoginPrompt(true)
      return
    }

    if (!newPostTitle.trim() || !newPostContent.trim()) {
      toast({
        title: "Error",
        description: "Title and content are required.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      // Process tags
      const tags = newPostTags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)

      const response = await fetch("/api/community/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newPostTitle,
          content: newPostContent,
          tags,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create post")
      }

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Your post has been submitted successfully.",
        })

        // Reset form
        setNewPostTitle("")
        setNewPostContent("")
        setNewPostTags("")
        setShowNewPostDialog(false)

        // Refresh posts
        fetchPosts()
        fetchTags()
      } else {
        throw new Error(data.error || "Failed to create post")
      }
    } catch (error) {
      console.error("Error creating post:", error)
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle submit comment
  const handleSubmitComment = async () => {
    if (!selectedPost) return

    if (sessionStatus !== "authenticated") {
      setShowLoginPrompt(true)
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

  // Handle view post
  const handleViewPost = async (post: Post) => {
    setSelectedPost(post)
    setShowPostDialog(true)
    await fetchComments(post.id)
  }

  // Handle share post
  const handleSharePost = (post: Post) => {
    const url = `${window.location.origin}/community/post/${post.id}`
    setShareUrl(url)
    setShowShareDialog(true)
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

  // Share on social media
  const shareOnSocialMedia = (platform: string) => {
    let shareLink = ""
    const text = "Check out this interesting discussion!"

    switch (platform) {
      case "facebook":
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
        break
      case "twitter":
        shareLink = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`
        break
      case "linkedin":
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
        break
      case "whatsapp":
        shareLink = `https://wa.me/?text=${encodeURIComponent(text + " " + shareUrl)}`
        break
      default:
        break
    }

    if (shareLink) {
      window.open(shareLink, "_blank")
    }

    setShowShareDialog(false)
  }

  // Copy link to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl)
    toast({
      title: "Link Copied",
      description: "The link has been copied to your clipboard.",
    })
    setShowShareDialog(false)
  }

  return (
    <div className="p-8 mb-40">
      <h1 className="text-3xl font-bold mb-6">Community</h1>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card className="mb-6">
            <div className="p-6 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-xl font-semibold flex items-center">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Discussion Forum
                </h2>
                <Button
                  onClick={() => {
                    if (sessionStatus === "authenticated") {
                      setShowNewPostDialog(true)
                    } else {
                      setShowLoginPrompt(true)
                    }
                  }}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  New Post
                </Button>
              </div>
            </div>

            <div className="p-6 border-b">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search discussions..."
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
                  <select
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={selectedTag || ""}
                    onChange={(e) => {
                      setSelectedTag(e.target.value || null)
                      // Trigger fetch when tag changes
                      setTimeout(() => fetchPosts(), 0)
                    }}
                  >
                    <option value="">All Tags</option>
                    {allTags.map((tag) => (
                      <option key={tag.id} value={tag.name}>
                        {tag.name} ({tag.count})
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setSearchQuery("")
                      setSelectedTag(null)
                      setActiveTab("latest")
                      setTimeout(() => fetchPosts(), 0)
                    }}
                    title="Clear filters"
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <Tabs
              value={activeTab}
              onValueChange={(value) => {
                setActiveTab(value)
                // Trigger fetch when tab changes
                setTimeout(() => fetchPosts(), 0)
              }}
            >
              <div className="px-6 pt-4">
                <TabsList>
                  <TabsTrigger value="latest">Latest</TabsTrigger>
                  <TabsTrigger value="popular">Popular</TabsTrigger>
                  <TabsTrigger value="unanswered">Unanswered</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value={activeTab} className="p-0 m-0">
                <div className="divide-y">
                  {isLoading ? (
                    <div className="p-12 text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                      <p className="text-muted-foreground">Loading discussions...</p>
                    </div>
                  ) : error ? (
                    <div className="p-12 text-center">
                      <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Error loading discussions</h3>
                      <p className="text-muted-foreground mb-4">{error}</p>
                      <Button onClick={fetchPosts} variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Try Again
                      </Button>
                    </div>
                  ) : posts.length > 0 ? (
                    posts.map((post) => (
                      <div key={post.id} className="p-6">
                        <div className="flex items-start gap-3">
                          <Image
                            src={post.author.avatar || "/placeholder.svg"}
                            alt={post.author.name}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                          <div className="flex-1">
                            <h3
                              className="font-medium text-lg mb-1 cursor-pointer hover:text-primary"
                              onClick={() => handleViewPost(post)}
                            >
                              {post.title}
                            </h3>
                            <p className="text-gray-600 mb-3">{post.content}</p>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {post.tags.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="outline"
                                  className="cursor-pointer hover:bg-secondary"
                                  onClick={() => {
                                    setSelectedTag(tag)
                                    setTimeout(() => fetchPosts(), 0)
                                  }}
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <button
                                  className={`flex items-center gap-1 text-sm ${post.isLiked ? "text-primary" : "text-gray-500"} hover:text-primary transition-colors`}
                                  onClick={() => handleLikePost(post.id)}
                                >
                                  <ThumbsUp className="h-4 w-4" />
                                  <span>{post.likes}</span>
                                </button>
                                <button
                                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary transition-colors"
                                  onClick={() => handleViewPost(post)}
                                >
                                  <MessageSquare className="h-4 w-4" />
                                  <span>{post.replies}</span>
                                </button>
                                <button
                                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary transition-colors"
                                  onClick={() => handleSharePost(post)}
                                >
                                  <Share2 className="h-4 w-4" />
                                  <span>Share</span>
                                </button>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span>{post.author.name}</span>
                                <span>•</span>
                                <span>{formatDate(post.date)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-12 text-center">
                      <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-900">No discussions found</h3>
                      <p className="text-gray-500 mt-1">Try adjusting your search or filters</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        <div>
          <Card className="mb-6">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Community Guidelines</h3>
            </div>
            <div className="p-6">
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <div className="rounded-full bg-green-100 p-1 mt-0.5">
                    <svg className="h-3 w-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span>Be respectful and courteous to other community members</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="rounded-full bg-green-100 p-1 mt-0.5">
                    <svg className="h-3 w-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span>Stay on topic and keep discussions relevant to business</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="rounded-full bg-green-100 p-1 mt-0.5">
                    <svg className="h-3 w-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span>No promotional content or spam</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="rounded-full bg-green-100 p-1 mt-0.5">
                    <svg className="h-3 w-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span>Protect your privacy - don&apos;t share sensitive information</span>
                </li>
              </ul>
            </div>
          </Card>

          <Card className="mb-6">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Popular Tags</h3>
            </div>
            <div className="p-6">
              <div className="flex flex-wrap gap-2">
                {allTags.slice(0, 10).map((tag) => (
                  <button
                    key={tag.id}
                    className={`text-sm px-3 py-1.5 rounded-full ${selectedTag === tag.name ? "bg-[#22c984] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                    onClick={() => {
                      setSelectedTag(selectedTag === tag.name ? null : tag.name)
                      setTimeout(() => fetchPosts(), 0)
                    }}
                  >
                    <Tag className="h-3.5 w-3.5 inline mr-1" />
                    {tag.name} ({tag.count})
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Recent Activity</h3>
            </div>
            <div className="p-6">
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.slice(0, 3).map((post) => (
                    <div key={post.id} className="flex items-start gap-3">
                      <div className="p-2 bg-gray-100 rounded-full">
                        <Clock className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm">
                          <span className="font-medium">{post.author.name}</span> posted{" "}
                          <span className="text-primary cursor-pointer" onClick={() => handleViewPost(post)}>
                            {post.title}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{formatDate(post.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* New Post Dialog */}
      <Dialog open={showNewPostDialog} onOpenChange={setShowNewPostDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Post</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div>
              <Label htmlFor="post-title">Title</Label>
              <Input
                id="post-title"
                placeholder="Enter a descriptive title"
                value={newPostTitle}
                onChange={(e) => setNewPostTitle(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="post-content">Content</Label>
              <Textarea
                id="post-content"
                placeholder="What would you like to discuss?"
                rows={5}
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="post-tags">Tags (separated by commas)</Label>
              <Input
                id="post-tags"
                placeholder="e.g. Business, Tax, Legal"
                value={newPostTags}
                onChange={(e) => setNewPostTags(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewPostDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePost} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  "Post to Community"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Login Prompt Dialog */}
      <AlertDialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Login Required</AlertDialogTitle>
            <AlertDialogDescription>
              You need to be logged in to perform this action. Would you like to log in now?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                onClick={() => {
                  window.location.href = "/login?callbackUrl=/dashboard/community"
                }}
              >
                Log In
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Post Detail Dialog */}
      <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          {selectedPost && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedPost.title}</DialogTitle>
              </DialogHeader>
              <div className="mt-4">
                <div className="flex items-start gap-3 mb-6">
                  <Image
                    src={selectedPost.author.avatar || "/placeholder.svg"}
                    alt={selectedPost.author.name}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                  <div>
                    <p className="font-medium">{selectedPost.author.name}</p>
                    <p className="text-sm text-gray-500">{formatDate(selectedPost.date)}</p>
                  </div>
                </div>

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
                  <button
                    className={`flex items-center gap-1 text-sm ${selectedPost.isLiked ? "text-primary" : "text-gray-500"} hover:text-primary transition-colors`}
                    onClick={() => handleLikePost(selectedPost.id)}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    <span>{selectedPost.likes} Likes</span>
                  </button>
                  <button
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary transition-colors"
                    onClick={() => handleSharePost(selectedPost)}
                  >
                    <Share2 className="h-4 w-4" />
                    <span>Share</span>
                  </button>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-4">Comments ({selectedPost.replies})</h3>

                  {sessionStatus === "authenticated" && (
                    <div className="flex gap-3 mb-6">
                      <Image
                        src={session?.user?.image || "/placeholder.svg"}
                        alt={session?.user?.name || "You"}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                      <div className="flex-1">
                        <Textarea
                          placeholder="Add a comment..."
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
                  )}

                  {isLoadingComments ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : postComments.length > 0 ? (
                    <div className="space-y-6">
                      {postComments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                          <Image
                            src={comment.author.avatar || "/placeholder.svg"}
                            alt={comment.author.name}
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">{comment.author.name}</p>
                              <span className="text-xs text-gray-500">{formatDate(comment.date)}</span>
                            </div>
                            <p className="text-gray-700 mb-2">{comment.content}</p>
                            <button
                              className={`flex items-center gap-1 text-xs ${comment.isLiked ? "text-primary" : "text-gray-500"} hover:text-primary transition-colors`}
                              onClick={() => handleLikeComment(comment.id)}
                            >
                              <ThumbsUp className="h-3 w-3" />
                              <span>{comment.likes} Likes</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No comments yet. Be the first to comment!</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Share Post</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full h-12 w-12"
                onClick={() => shareOnSocialMedia("facebook")}
              >
                <Facebook className="h-5 w-5 text-blue-600" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full h-12 w-12"
                onClick={() => shareOnSocialMedia("twitter")}
              >
                <Twitter className="h-5 w-5 text-sky-500" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full h-12 w-12"
                onClick={() => shareOnSocialMedia("linkedin")}
              >
                <Linkedin className="h-5 w-5 text-blue-700" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full h-12 w-12"
                onClick={() => shareOnSocialMedia("whatsapp")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-green-500"
                >
                  <path d="M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.273-.101-.473-.15-.673.15-.2.3-.767.966-.94 1.164-.173.199-.347.223-.647.075-.3-.15-1.269-.467-2.416-1.483-.893-.795-1.484-1.77-1.66-2.07-.174-.3-.019-.462.13-.61.136-.137.301-.354.451-.531.15-.178.2-.301.3-.502.099-.2.05-.374-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.007-.371-.01-.571-.01-.2 0-.523.074-.797.372-.273.297-1.045 1.02-1.045 2.475 0 1.455 1.064 2.862 1.213 3.063.15.2 2.105 3.21 5.1 4.495.713.308 1.27.492 1.705.626.714.227 1.365.195 1.88.118.574-.078 1.767-.72 2.016-1.413.255-.694.255-1.29.18-1.414-.074-.124-.272-.198-.57-.347z" />
                  <path d="M13.507 8.4a1 1 0 0 0-1.414 0l-2.293 2.293a1 1 0 0 0 0 1.414l2.293 2.293a1 1 0 0 0 1.414 0l2.293-2.293a1 1 0 0 0 0-1.414L13.507 8.4z" />
                  <path d="M12 2C6.486 2 2 6.486 2 12c0 1.572.37 3.07 1.023 4.389L2 22l5.611-1.023A9.959 9.959 0 0 0 12 22c5.514 0 10-4.486 10-10S17.514 2 12 2z" />
                </svg>
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Input value={shareUrl} readOnly />
              <Button variant="outline" size="icon" onClick={copyToClipboard}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

