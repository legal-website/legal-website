"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { createMessage } from "@/lib/actions/ticket-actions"
import type { Ticket } from "@/types/ticket"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { PaperclipIcon, SendIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function TicketDetailClient({ ticket }: { ticket: Ticket }) {
  const [message, setMessage] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const router = useRouter()

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

    try {
      // Create a copy of the files array to avoid issues with the files being modified during upload
      const filesToUpload = files.length > 0 ? [...files] : undefined

      const result = await createMessage({ content: message, ticketId: ticket.id }, filesToUpload)

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      } else {
        setMessage("")
        setFiles([])
        router.refresh()

        toast({
          title: "Message sent",
          description: "Your message has been sent successfully",
        })
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
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
    <div className="container mx-auto py-4 sm:py-6 space-y-4 sm:space-y-6 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h1 className="text-xl sm:text-2xl font-bold">Ticket #{ticket.id.substring(0, 8)}</h1>
        <div className="flex space-x-2">
          <Badge className={getStatusColor(ticket.status)}>{ticket.status}</Badge>
          <Badge className={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{ticket.subject}</CardTitle>
          <CardDescription>
            Created {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{ticket.description}</p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Conversation</h2>

        {ticket.messages && ticket.messages.length > 0 ? (
          <div className="space-y-4">
            {ticket.messages.map((msg) => (
              <Card key={msg.id}>
                <CardHeader className="pb-2 p-3 sm:p-6">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Avatar>
                        <AvatarFallback>{msg.sender === "system" ? "SY" : getInitials(msg.senderName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{msg.senderName}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    {msg.sender === "system" && <Badge variant="outline">System</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Attachments:</p>
                      <div className="space-y-2">
                        {msg.attachments.map((attachment) => (
                          <a
                            key={attachment.id}
                            href={attachment.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center p-2 border rounded hover:bg-gray-50"
                          >
                            <PaperclipIcon className="h-4 w-4 mr-2" />
                            <span>{attachment.name}</span>
                            <span className="ml-auto text-xs text-muted-foreground">{attachment.size}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No messages yet. Start the conversation by sending a message.
            </CardContent>
          </Card>
        )}

        {ticket.status !== "closed" && (
          <Card>
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Reply to this ticket</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-3 sm:p-6">
                <Textarea
                  placeholder="Type your message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="resize-none"
                />

                <div>
                  <Label htmlFor="files" className="cursor-pointer inline-flex items-center">
                    <PaperclipIcon className="h-4 w-4 mr-2" />
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
                </div>

                {files.length > 0 && (
                  <div className="space-y-2">
                    {Array.from(files).map((file, index) => (
                      <div key={index} className="flex items-center p-2 border rounded">
                        <PaperclipIcon className="h-4 w-4 mr-2" />
                        <span>{file.name}</span>
                        <span className="ml-auto text-xs text-muted-foreground">{Math.round(file.size / 1024)} KB</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
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
              </CardContent>
              <CardFooter className="p-3 sm:p-6 flex flex-wrap gap-2">
                <Button type="submit" disabled={isSubmitting || !message.trim()} className="ml-auto">
                  {isSubmitting ? (
                    "Sending..."
                  ) : (
                    <>
                      <SendIcon className="h-4 w-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}
      </div>
    </div>
  )
}

