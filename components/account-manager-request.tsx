"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { ExternalLink } from "lucide-react"

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

  useEffect(() => {
    fetchManagerRequest()
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
      return "Request a Dedicated Account Manager"
    }

    switch (managerRequest.status) {
      case "requested":
      case "pending":
        return "Dedicated Account Manager Requested"
      case "approved":
        return "Contact Account Manager"
      case "rejected":
        return "Request a Dedicated Account Manager"
      default:
        return "Request a Dedicated Account Manager"
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
    <div className="flex flex-col space-y-2">
      <Button
        onClick={handleButtonClick}
        disabled={requesting || managerRequest?.status === "requested" || managerRequest?.status === "pending"}
        className="w-full"
        variant={managerRequest?.status === "approved" ? "default" : "outline"}
      >
        {requesting ? "Submitting..." : getButtonText()}
        {managerRequest?.status === "approved" && <ExternalLink className="ml-2 h-4 w-4" />}
      </Button>

      {managerRequest?.status === "approved" && managerRequest.managerName && (
        <p className="text-xs text-center text-gray-500">{managerRequest.managerName} is your Orizen account manager</p>
      )}
    </div>
  )
}

