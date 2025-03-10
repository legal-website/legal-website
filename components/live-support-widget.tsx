"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageCircle, X, Send, Loader2 } from "lucide-react"
import { useTheme } from "@/context/theme-context"

interface Message {
  id: string
  text: string
  sender: "user" | "support"
  timestamp: Date
}

export default function LiveSupportWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "👋 Hi there! How can we help you today?",
      sender: "support",
      timestamp: new Date(),
    },
  ])
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = () => {
    if (!message.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: message,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setMessage("")

    // Simulate typing indicator
    setIsTyping(true)

    // Prepare WhatsApp message
    const whatsappNumber = "923165010567"
    const whatsappText = encodeURIComponent(`New message from dashboard: ${message}`)

    // In a real implementation, you would send this to your backend
    // For now, we'll open WhatsApp in a new tab (this is just for demonstration)
    if (typeof window !== "undefined") {
      // This would normally be handled by your backend service
      // Opening WhatsApp directly from frontend is just for demonstration
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${whatsappText}`
      window.open(whatsappUrl, "_blank")
    }

    // Simulate typing indicator
    setTimeout(() => {
      setIsTyping(false)

      // Add support response
      const supportMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Thanks for your message! Our team has been notified and will respond to you shortly via WhatsApp.",
        sender: "support",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, supportMessage])
    }, 2000)
  }

  return (
    <>
      {/* Chat button */}
      <button
        className={`fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-300 ${
          isOpen ? "bg-red-500 rotate-90" : "bg-[#22c984]"
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6 text-white" /> : <MessageCircle className="h-6 w-6 text-white" />}
      </button>

      {/* Chat widget */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-80 md:w-96 rounded-lg shadow-xl transition-all duration-300 transform ${
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"
        } ${theme === "dark" ? "bg-gray-800 text-white" : theme === "comfort" ? "bg-[#f8f4e3] text-[#5c4f3a]" : "bg-white"}`}
      >
        {/* Header */}
        <div className="bg-[#22c984] text-white p-4 rounded-t-lg">
          <h3 className="font-bold">Live Support</h3>
          <p className="text-sm opacity-90">We typically reply within minutes</p>
        </div>

        {/* Messages */}
        <div
          className={`h-80 overflow-y-auto p-4 space-y-4 ${theme === "dark" ? "bg-gray-800" : theme === "comfort" ? "bg-[#f8f4e3]" : ""}`}
        >
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.sender === "user"
                    ? "bg-[#22c984] text-white"
                    : theme === "dark"
                      ? "bg-gray-700 text-white"
                      : theme === "comfort"
                        ? "bg-[#efe9d8] text-[#5c4f3a]"
                        : "bg-gray-100 text-gray-800"
                }`}
              >
                <p>{msg.text}</p>
                <p className="text-xs opacity-70 mt-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div
                className={`rounded-lg p-3 flex items-center ${
                  theme === "dark"
                    ? "bg-gray-700 text-white"
                    : theme === "comfort"
                      ? "bg-[#efe9d8] text-[#5c4f3a]"
                      : "bg-gray-100 text-gray-800"
                }`}
              >
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm">Support is typing...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div
          className={`p-4 border-t ${
            theme === "dark" ? "border-gray-700" : theme === "comfort" ? "border-[#e8e4d3]" : ""
          }`}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage()
            }}
            className="flex gap-2"
          >
            <Input
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className={`flex-1 ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white"
                  : theme === "comfort"
                    ? "bg-[#f8f4e3] border-[#e8e4d3] text-[#5c4f3a]"
                    : ""
              }`}
            />
            <Button type="submit" size="icon" className="bg-[#22c984] hover:bg-[#1eac73]">
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <p
            className={`text-xs mt-2 ${
              theme === "dark" ? "text-gray-400" : theme === "comfort" ? "text-[#7c6f5a]" : "text-gray-500"
            }`}
          >
            Connected to WhatsApp: +92 3165010567
          </p>
        </div>
      </div>
    </>
  )
}

