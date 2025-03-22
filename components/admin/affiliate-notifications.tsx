"use client"

import { useEffect, useState } from "react"
import { Bell } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface Conversion {
  id: string
  orderId: string
  amount: number
  commission: number
  status: string
  link: {
    user: {
      name: string
      email: string
    }
  }
}

export function AffiliateNotifications() {
  const [pendingCount, setPendingCount] = useState(0)
  const [pendingConversions, setPendingConversions] = useState<Conversion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPendingConversions = async () => {
      try {
        const res = await fetch("/api/admin/affiliate/conversions?status=PENDING")
        const data = await res.json()

        if (res.ok) {
          setPendingConversions(data.conversions || [])
          setPendingCount(data.conversions?.length || 0)
        }

        setLoading(false)
      } catch (error) {
        console.error("Error fetching pending conversions:", error)
        setLoading(false)
      }
    }

    fetchPendingConversions()

    // Refresh every 5 minutes
    const interval = setInterval(fetchPendingConversions, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/affiliate/conversions/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "APPROVED" }),
      })

      if (res.ok) {
        // Remove from list
        setPendingConversions((prev) => prev.filter((conv) => conv.id !== id))
        setPendingCount((prev) => prev - 1)
      }
    } catch (error) {
      console.error("Error approving conversion:", error)
    }
  }

  const handleReject = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/affiliate/conversions/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "REJECTED" }),
      })

      if (res.ok) {
        // Remove from list
        setPendingConversions((prev) => prev.filter((conv) => conv.id !== id))
        setPendingCount((prev) => prev - 1)
      }
    } catch (error) {
      console.error("Error rejecting conversion:", error)
    }
  }

  // Don't render anything if there are no pending conversions
  if (pendingCount === 0 && !loading) {
    return null
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {pendingCount > 0 && (
            <Badge className="absolute -top-2 -right-2 px-1.5 py-0.5 min-w-5 h-5 flex items-center justify-center">
              {pendingCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b">
          <h3 className="font-medium">Pending Affiliate Conversions</h3>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
          ) : pendingConversions.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">No pending conversions</div>
          ) : (
            <div className="divide-y">
              {pendingConversions.map((conversion) => (
                <div key={conversion.id} className="p-3">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">Order #{conversion.orderId.slice(-6)}</span>
                    <span className="text-green-600 font-medium">${conversion.commission.toFixed(2)}</span>
                  </div>
                  <div className="text-sm text-gray-500 mb-2">
                    Affiliate: {conversion.link?.user?.name || "Unknown"}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="w-full" onClick={() => handleReject(conversion.id)}>
                      Reject
                    </Button>
                    <Button size="sm" className="w-full" onClick={() => handleApprove(conversion.id)}>
                      Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

