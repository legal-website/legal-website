"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Eye } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

interface PersonalDetail {
  id: string
  status: string
  createdAt: string
  updatedAt: string
  user: {
    name: string | null
    email: string
  }
}

export function RecentPersonalDetails() {
  const [personalDetails, setPersonalDetails] = useState<PersonalDetail[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecentPersonalDetails = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/admin/personal-details?limit=3")

        if (!response.ok) {
          throw new Error("Failed to fetch personal details")
        }

        const data = await response.json()
        setPersonalDetails(data.personalDetails)
      } catch (error) {
        console.error("Error fetching recent personal details:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentPersonalDetails()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-500 hover:bg-yellow-600"
      case "APPROVED":
        return "bg-green-500 hover:bg-green-600"
      case "REJECTED":
        return "bg-red-500 hover:bg-red-600"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Recent Personal Details</CardTitle>
        <CardDescription>Latest personal details verification submissions</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {loading ? (
            Array(3)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-3 w-[150px]" />
                  </div>
                  <Skeleton className="h-8 w-[80px]" />
                </div>
              ))
          ) : personalDetails.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">No personal details submissions found</div>
          ) : (
            personalDetails.map((detail) => (
              <div key={detail.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{detail.user.name || detail.user.email}</p>
                  <p className="text-sm text-muted-foreground">
                    Submitted {format(new Date(detail.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(detail.status)}>{detail.status}</Badge>
                  <Link href={`/admin/Personal-details?id=${detail.id}`}>
                    <Button variant="ghost" size="icon" title="View details">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-3">
        <Link href="/admin/Personal-details" className="w-full">
          <Button variant="outline" className="w-full">
            View All Personal Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}

