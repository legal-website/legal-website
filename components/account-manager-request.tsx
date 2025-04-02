"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { ExternalLink, Clock, XCircle, User } from "lucide-react"

interface AccountManagerRequestProps {
  userId: string
}

interface ManagerRequest {
  id: string
  userId: string
  status: "requested" | "pending" | "approved" | "rejected"
  managerName?: string
  contactLink?: string
  createdAt: string
  updatedAt: string
}

export function AccountManagerRequest({ userId }: AccountManagerRequestProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)
  const [managerRequest, setManagerRequest] = useState<ManagerRequest | null>(null)
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 0)

  useEffect(() => {
    fetchManagerRequest()
  }, [])

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }

    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleResize)
      return () => window.removeEventListener("resize", handleResize)
    }
  }, [])

  const fetchManagerRequest = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/user/account-manager-request")

      if (!response.ok) {
        throw new Error("Failed to fetch account manager request")
      }

      const data = await response.json()
      setManagerRequest(data.request)
    } catch (error) {
      console.error("Error fetching account manager request:", error)
    } finally {
      setLoading(false)
    }
  }

  const requestAccountManager = async () => {
    try {
      setRequesting(true)
      const response = await fetch("/api/user/account-manager-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to submit request")
      }

      const data = await response.json()
      setManagerRequest(data.request)

      toast({
        title: "Request Submitted",
        description: "Your dedicated account manager request has been submitted.",
      })
    } catch (error) {
      console.error("Error requesting account manager:", error)
      toast({
        title: "Request Failed",
        description: "Failed to submit your request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setRequesting(false)
    }
  }

  const getButtonText = () => {
    if (!managerRequest) {
      return window.innerWidth < 640 ? "Request Account Manager" : "Request a Dedicated Account Manager"
    }

    switch (managerRequest.status) {
      case "requested":
        return window.innerWidth < 640 ? "Manager Requested" : "Dedicated Account Manager Requested"
      case "pending":
        return window.innerWidth < 640 ? "Request Pending" : "Dedicated Account Manager Request is Pending"
      case "approved":
        return "Contact Account Manager"
      case "rejected":
        return window.innerWidth < 640 ? "Request Account Manager" : "Request a Dedicated Account Manager"
      default:
        return window.innerWidth < 640 ? "Request Account Manager" : "Request a Dedicated Account Manager"
    }
  }

  const getButtonIcon = () => {
    if (!managerRequest) {
      return <User className="h-3 w-3 sm:h-4 sm:w-4" />
    }

    switch (managerRequest.status) {
      case "requested":
        return <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
      case "pending":
        return <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
      case "approved":
        return <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
      case "rejected":
        return <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
      default:
        return <User className="h-3 w-3 sm:h-4 sm:w-4" />
    }
  }

  const getButtonVariant = () => {
    if (!managerRequest) {
      return "outline"
    }

    switch (managerRequest.status) {
      case "requested":
        return "outline"
      case "pending":
        return "outline"
      case "approved":
        return "default"
      case "rejected":
        return "outline"
      default:
        return "outline"
    }
  }

  const handleButtonClick = () => {
    if (!managerRequest) {
      requestAccountManager()
      return
    }

    if (managerRequest.status === "approved" && managerRequest.contactLink) {
      window.open(managerRequest.contactLink, "_blank")
      return
    }

    if (managerRequest.status === "rejected") {
      requestAccountManager()
      return
    }
  }

  if (loading) {
    return <Button disabled>Loading...</Button>
  }

  return (
    <div className="flex flex-col space-y-2 w-full max-w-full">
      <Button
        onClick={handleButtonClick}
        disabled={requesting || managerRequest?.status === "requested" || managerRequest?.status === "pending"}
        className="w-full flex items-center justify-center text-xs sm:text-sm whitespace-normal h-auto py-2 sm:py-2.5"
        variant={getButtonVariant() as any}
      >
        <span className="mr-2">{requesting ? "Submitting..." : getButtonText()}</span>
        {getButtonIcon()}
      </Button>

      {managerRequest?.status === "approved" && managerRequest.managerName && (
        <p className="text-xs text-center text-gray-500 px-2 break-words">
          {managerRequest.managerName} is your Orizen account manager
        </p>
      )}

      {managerRequest?.status === "pending" && (
        <p className="text-xs text-center text-gray-500 px-2">Your request is being reviewed by our team</p>
      )}
    </div>
  )
}

