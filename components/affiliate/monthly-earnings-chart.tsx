"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { groupDataByMonth } from "@/lib/chart-utils"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface AffiliateConversion {
  id: string
  createdAt: string
  amount: string | number
  commission: string | number
  status: string
}

export function MonthlyEarningsChart() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/affiliate/conversions")

        if (!response.ok) {
          throw new Error("Failed to fetch conversion data")
        }

        const result = await response.json()

        if (result.conversions && Array.isArray(result.conversions)) {
          // Only include approved conversions
          const approvedConversions = result.conversions.filter(
            (conversion: AffiliateConversion) => conversion.status === "APPROVED" || conversion.status === "PAID",
          )

          // Group by month and sum commissions
          const monthlyData = groupDataByMonth(approvedConversions, "createdAt", "commission")

          setData(monthlyData)
        } else {
          setData([])
        }
      } catch (err) {
        console.error("Error fetching conversion data:", err)
        setError("Failed to load earnings data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Earnings</CardTitle>
          <CardDescription>Your commission earnings over the past 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-[300px]" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Earnings</CardTitle>
          <CardDescription>Your commission earnings over the past 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-red-50 text-red-800 rounded-md">{error}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Earnings</CardTitle>
        <CardDescription>Your commission earnings over the past 6 months</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            value: {
              label: "Earnings",
              color: "hsl(var(--chart-1))",
            },
          }}
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis dataKey="month" tickLine={false} axisLine={false} padding={{ left: 10, right: 10 }} />
              <YAxis tickFormatter={(value) => `$${value}`} tickLine={false} axisLine={false} tickCount={5} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="value" strokeWidth={2} activeDot={{ r: 6 }} stroke="var(--color-value)" />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

