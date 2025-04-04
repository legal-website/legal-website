"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageCircle, X, Send, Loader2, ExternalLink } from "lucide-react"
import { useTheme } from "@/context/theme-context"
import TawkChatWidget from "./tawk-chat-widget"

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
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [showUserForm, setShowUserForm] = useState(true)
  const [tawkLoaded, setTawkLoaded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()

  // Your Tawk.to property ID and widget ID from the script
  const TAWK_PROPERTY_ID = "67f00b05d92782190b0d0ee5"
  const TAWK_WIDGET_ID = "1io0qm3sc"

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Check if user info is stored in localStorage
  useEffect(() => {
    const storedName = localStorage.getItem("chat_widget_name")
    const storedEmail = localStorage.getItem("chat_widget_email")

    if (storedName && storedEmail) {
      setUserName(storedName)
      setUserEmail(storedEmail)
      setShowUserForm(false)
    }
  }, [])

  // Handle Tawk.to API
  useEffect(() => {
    if (isOpen && !showUserForm) {
      // When our widget is open and user info is provided, we can interact with Tawk API
      if (typeof window !== "undefined" && window.Tawk_API) {
        if (!tawkLoaded) {
          setTawkLoaded(true)
        }

        // Set visitor data
        if (typeof window.Tawk_API.onLoad === "function") {
          window.Tawk_API.onLoad = () => {
            window.Tawk_API?.setAttributes(
              {
                name: userName,
                email: userEmail,
              },
              (error) => {
                // Handle error if needed
              },
            )
          }
        }

        // Open Tawk chat window when our custom widget is opened
        if (typeof window.Tawk_API.isChatHidden === "function" && window.Tawk_API.isChatHidden()) {
          window.Tawk_API.showWidget()
          window.Tawk_API.maximize()
        }
      }
    } else {
      // Hide Tawk chat when our widget is closed
      if (typeof window !== "undefined" && window.Tawk_API && typeof window.Tawk_API.hideWidget === "function") {
        window.Tawk_API.hideWidget()
      }
    }
  }, [isOpen, showUserForm, userName, userEmail, tawkLoaded])

  const handleUserFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (userName.trim() && userEmail.trim()) {
      // Store user info in localStorage
      localStorage.setItem("chat_widget_name", userName)
      localStorage.setItem("chat_widget_email", userEmail)
      setShowUserForm(false)

      // Add welcome message
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        text: `Thanks ${userName}! What can we help you with today?`,
        sender: "support",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, welcomeMessage])

      // If Tawk is loaded, set visitor data
      if (typeof window !== "undefined" && window.Tawk_API && typeof window.Tawk_API.setAttributes === "function") {
        window.Tawk_API.setAttributes(
          {
            name: userName,
            email: userEmail,
          },
          (error) => {
            // Handle error if needed
          },
        )
      }
    }
  }

  const handleSendMessage = () => {
    if (!message.trim()) return

    // Add user message to our UI
    const userMessage: Message = {
      id: Date.now().toString(),
      text: message,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])

    // If Tawk is loaded, send message to Tawk
    if (typeof window !== "undefined" && window.Tawk_API && typeof window.Tawk_API.maximize === "function") {
      // Make sure the widget is visible
      window.Tawk_API.maximize()

      // There's no direct API to send a message
      // instructing the user to continue in the Tawk widget
      setTimeout(() => {
        const systemMessage: Message = {
          id: Date.now().toString(),
          text: "Please continue your conversation in the chat window that has opened.",
          sender: "support",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, systemMessage])
      }, 1000)
    }

    // Clear input
    setMessage("")
  }

  const openTawkDirectly = () => {
    if (typeof window !== "undefined" && window.Tawk_API && typeof window.Tawk_API.maximize === "function") {
      window.Tawk_API.maximize()
    }
  }

  return (
    <>
      {/* Load Tawk.to widget */}
      <TawkChatWidget propertyId={TAWK_PROPERTY_ID} widgetId={TAWK_WIDGET_ID} />

      {/* Chat button */}
      <button
        className={`fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-300 ${
          isOpen ? "bg-red-500 rotate-90" : "bg-blue-600"
        }`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close chat" : "Open chat"}
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
        <div className="bg-blue-600 text-white p-4 rounded-t-lg">
          <h3 className="font-bold">Live Support</h3>
          <p className="text-sm opacity-90">We typically reply within minutes</p>
        </div>

        {showUserForm ? (
          <div className="p-4">
            <h4 className="font-medium mb-3">Please introduce yourself</h4>
            <form onSubmit={handleUserFormSubmit} className="space-y-3">
              <div>
                <label htmlFor="name" className="text-sm font-medium block mb-1">
                  Your Name
                </label>
                <Input
                  id="name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className={theme === "dark" ? "bg-gray-700 border-gray-600" : ""}
                />
              </div>
              <div>
                <label htmlFor="email" className="text-sm font-medium block mb-1">
                  Your Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="john@example.com"
                  required
                  className={theme === "dark" ? "bg-gray-700 border-gray-600" : ""}
                />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                Start Chat
              </Button>
            </form>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div
              className={`h-80 overflow-y-auto p-4 space-y-4 ${theme === "dark" ? "bg-gray-800" : theme === "comfort" ? "bg-[#f8f4e3]" : ""}`}
            >
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.sender === "user"
                        ? "bg-blue-100 text-blue-900"
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

            {/* Open chat directly button */}
            {messages.length > 2 && (
              <div className="px-4 pb-2">
                <Button
                  onClick={openTawkDirectly}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Full Chat Window
                </Button>
              </div>
            )}

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
                <Button type="submit" size="icon" className="bg-blue-600 hover:bg-blue-700">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              <p
                className={`text-xs mt-2 ${
                  theme === "dark" ? "text-gray-400" : theme === "comfort" ? "text-[#7c6f5a]" : "text-gray-500"
                }`}
              >
                Powered by Tawk.to Live Chat
              </p>
            </div>
          </>
        )}
      </div>
    </>
  )
}

