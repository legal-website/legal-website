"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { createMessage } from "@/lib/actions/ticket-actions"
import type { Ticket } from "@/types/ticket"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { PaperclipIcon, SendIcon, ChevronLeft } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

export default function TicketDetail({
  ticket,
  onMessageSent,
}: {
  ticket: Ticket
  onMessageSent?: () => void
}) {
  const [message, setMessage] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const router = useRouter()

  // Scroll to bottom of messages when they change
  useEffect(() => {
    scrollToBottom()
  }, [ticket.messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!message.trim()) {
      toast({
        title: "Message required",
        description: "Please enter a message",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    const result = await createMessage({ content: message, ticketId: ticket.id }, files.length > 0 ? files : undefined)

    setIsSubmitting(false)

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
      return
    }

    setMessage("")
    setFiles([])

    // Notify parent component that a message was sent
    if (onMessageSent) {
      onMessageSent()
    }

    toast({
      title: "Message sent",
      description: "Your message has been sent successfully",
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-500"
      case "in-progress":
        return "bg-yellow-500"
      case "resolved":
        return "bg-green-500"
      case "closed":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "bg-blue-500"
      case "medium":
        return "bg-yellow-500"
      case "high":
        return "bg-orange-500"
      case "urgent":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden mr-2"
              onClick={() => router.push("/dashboard/tickets")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-semibold">{ticket.subject}</h2>
          </div>
          <div className="text-sm text-muted-foreground">
            Ticket #{ticket.id.substring(0, 8)} · {ticket.category}
          </div>
        </div>
        <div className="flex space-x-2">
          <Badge className={getStatusColor(ticket.status)}>{ticket.status}</Badge>
          <Badge className={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Initial ticket message */}
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <Avatar>
              <AvatarFallback>{getInitials(ticket.creator?.name || ticket.creator?.email || "")}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{ticket.creator?.name || ticket.creator?.email}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
          <div className="ml-10">
            <div className="bg-muted p-3 rounded-lg">
              <p className="whitespace-pre-wrap">{ticket.description}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Conversation messages */}
        {ticket.messages && ticket.messages.length > 0
          ? ticket.messages.map((msg) => {
              const isSystem = msg.sender === "system"
              const isCurrentUser = !isSystem && msg.sender === ticket.creatorId

              return (
                <div key={msg.id} className="flex flex-col space-y-2">
                  {isSystem ? (
                    <div className="flex justify-center">
                      <Badge variant="outline" className="bg-muted/50">
                        {msg.content}
                      </Badge>
                    </div>
                  ) : (
                    <>
                      <div
                        className={cn(
                          "flex items-center space-x-2",
                          isCurrentUser ? "self-end flex-row-reverse space-x-reverse" : "",
                        )}
                      >
                        <Avatar>
                          <AvatarFallback>{getInitials(msg.senderName)}</AvatarFallback>
                        </Avatar>
                        <div className={cn(isCurrentUser ? "text-right" : "")}>
                          <p className="font-medium">{msg.senderName}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <div className={cn("max-w-[80%]", isCurrentUser ? "self-end ml-10" : "ml-10")}>
                        <div
                          className={cn(
                            "p-3 rounded-lg",
                            isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted",
                          )}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>

                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {msg.attachments.map((attachment) => (
                              <a
                                key={attachment.id}
                                href={attachment.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn(
                                  "flex items-center p-2 rounded",
                                  isCurrentUser
                                    ? "bg-primary/80 text-primary-foreground hover:bg-primary/90"
                                    : "bg-muted/80 hover:bg-muted",
                                )}
                              >
                                <PaperclipIcon className="h-4 w-4 mr-2" />
                                <span className="text-sm truncate flex-1">{attachment.name}</span>
                                <span className="text-xs opacity-70">{attachment.size}</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })
          : null}

        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      {ticket.status !== "closed" && (
        <div className="p-4 border-t">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center space-x-2">
              <Textarea
                placeholder="Type your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[80px] resize-none"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label
                  htmlFor="files"
                  className="cursor-pointer inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
                >
                  <PaperclipIcon className="h-4 w-4 mr-1" />
                  {files.length > 0 ? `${files.length} file(s) selected` : "Attach files"}
                </Label>
                <Input
                  id="files"
                  type="file"
                  multiple
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />

                {files.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {Array.from(files).map((file, index) => (
                      <div key={index} className="flex items-center text-xs">
                        <span className="truncate max-w-[200px]">{file.name}</span>
                        <span className="mx-1 text-muted-foreground">({Math.round(file.size / 1024)} KB)</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0"
                          onClick={() => {
                            const newFiles = Array.from(files)
                            newFiles.splice(index, 1)
                            setFiles(newFiles)
                          }}
                        >
                          &times;
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button type="submit" disabled={isSubmitting || !message.trim()}>
                {isSubmitting ? (
                  "Sending..."
                ) : (
                  <>
                    <SendIcon className="h-4 w-4 mr-2" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

