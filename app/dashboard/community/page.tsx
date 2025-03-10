"use client"

import { Label } from "@/components/ui/label"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageCircle, Search, ThumbsUp, MessageSquare, Clock, Tag, Filter, PlusCircle } from "lucide-react"

interface Post {
  id: string
  title: string
  content: string
  author: {
    name: string
    avatar: string
  }
  date: string
  tags: string[]
  likes: number
  replies: number
  isLiked: boolean
}

export default function CommunityPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [newPostTitle, setNewPostTitle] = useState("")
  const [newPostContent, setNewPostContent] = useState("")
  const [posts, setPosts] = useState<Post[]>([
    {
      id: "1",
      title: "How do I update my business address?",
      content:
        "I recently moved my business to a new location and need to update my address with the state. What's the best way to do this through the platform?",
      author: {
        name: "John Doe",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      date: "2 hours ago",
      tags: ["Address Change", "Business Update"],
      likes: 5,
      replies: 3,
      isLiked: false,
    },
    {
      id: "2",
      title: "Annual report filing deadline question",
      content:
        "I'm confused about when my annual report is due. The dashboard shows one date but I received an email with a different date. Can someone clarify?",
      author: {
        name: "Sarah Smith",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      date: "1 day ago",
      tags: ["Annual Report", "Compliance"],
      likes: 8,
      replies: 6,
      isLiked: true,
    },
    {
      id: "3",
      title: "Best practices for maintaining corporate minutes",
      content:
        "I'm looking for advice on how other business owners maintain their corporate minutes. What tools or templates do you recommend?",
      author: {
        name: "Mike Johnson",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      date: "3 days ago",
      tags: ["Corporate Governance", "Best Practices"],
      likes: 12,
      replies: 9,
      isLiked: false,
    },
    {
      id: "4",
      title: "Tax implications of changing from LLC to S-Corp",
      content:
        "I'm considering changing my LLC to an S-Corporation for tax purposes. Has anyone gone through this process? What were the benefits and challenges?",
      author: {
        name: "Emily Chen",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      date: "1 week ago",
      tags: ["Taxes", "Business Structure"],
      likes: 15,
      replies: 11,
      isLiked: false,
    },
  ])

  const allTags = Array.from(new Set(posts.flatMap((post) => post.tags)))

  const handleLikePost = (postId: string) => {
    setPosts(
      posts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            isLiked: !post.isLiked,
          }
        }
        return post
      }),
    )
  }

  const handleCreatePost = () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) return

    const newPost: Post = {
      id: Date.now().toString(),
      title: newPostTitle,
      content: newPostContent,
      author: {
        name: "You",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      date: "Just now",
      tags: ["General"],
      likes: 0,
      replies: 0,
      isLiked: false,
    }

    setPosts([newPost, ...posts])
    setNewPostTitle("")
    setNewPostContent("")
  }

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTag = selectedTag ? post.tags.includes(selectedTag) : true
    return matchesSearch && matchesTag
  })

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
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      New Post
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
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
                        <Label htmlFor="post-tags">Tags (optional)</Label>
                        <Input id="post-tags" placeholder="Enter tags separated by commas" />
                      </div>
                      <Button className="w-full" onClick={handleCreatePost}>
                        Post to Community
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
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
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={selectedTag || ""}
                    onChange={(e) => setSelectedTag(e.target.value || null)}
                  >
                    <option value="">All Tags</option>
                    {allTags.map((tag) => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <Tabs defaultValue="latest">
              <div className="px-6 pt-4">
                <TabsList>
                  <TabsTrigger value="latest">Latest</TabsTrigger>
                  <TabsTrigger value="popular">Popular</TabsTrigger>
                  <TabsTrigger value="unanswered">Unanswered</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="latest" className="p-0 m-0">
                <div className="divide-y">
                  {filteredPosts.length > 0 ? (
                    filteredPosts.map((post) => (
                      <div key={post.id} className="p-6">
                        <div className="flex items-start gap-3">
                          <img
                            src={post.author.avatar || "/placeholder.svg"}
                            alt={post.author.name}
                            className="w-10 h-10 rounded-full"
                          />
                          <div className="flex-1">
                            <h3 className="font-medium text-lg mb-1">{post.title}</h3>
                            <p className="text-gray-600 mb-3">{post.content}</p>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {post.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-xs px-2 py-1 bg-gray-100 rounded-full"
                                  onClick={() => setSelectedTag(tag)}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <button
                                  className={`flex items-center gap-1 text-sm ${post.isLiked ? "text-blue-600" : "text-gray-500"}`}
                                  onClick={() => handleLikePost(post.id)}
                                >
                                  <ThumbsUp className="h-4 w-4" />
                                  <span>{post.likes}</span>
                                </button>
                                <button className="flex items-center gap-1 text-sm text-gray-500">
                                  <MessageSquare className="h-4 w-4" />
                                  <span>{post.replies}</span>
                                </button>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span>{post.author.name}</span>
                                <span>•</span>
                                <span>{post.date}</span>
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

              <TabsContent value="popular" className="p-6">
                <div className="text-center py-8">
                  <p className="text-gray-500">Popular discussions would appear here</p>
                </div>
              </TabsContent>

              <TabsContent value="unanswered" className="p-6">
                <div className="text-center py-8">
                  <p className="text-gray-500">Unanswered discussions would appear here</p>
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
                  <span>Protect your privacy - don't share sensitive information</span>
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
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    className={`text-sm px-3 py-1.5 rounded-full ${selectedTag === tag ? "bg-[#22c984] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  >
                    <Tag className="h-3.5 w-3.5 inline mr-1" />
                    {tag}
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
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="p-2 bg-gray-100 rounded-full">
                      <Clock className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm">
                        <span className="font-medium">Sarah Smith</span> replied to{" "}
                        <span className="text-blue-600">Annual report filing deadline question</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{i * 10} minutes ago</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

