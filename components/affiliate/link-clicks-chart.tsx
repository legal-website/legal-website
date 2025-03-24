"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { groupDataByMonth } from "@/lib/chart-utils"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { ChartContainer } from "@/components/ui/chart"

interface AffiliateClick {
  id: string
  createdAt: string
  linkId: string
  count?: number
}

// Custom tooltip component for the chart
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-muted-foreground">Month</span>
            <span className="font-bold text-muted-foreground">{payload[0].payload.month}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-muted-foreground">Clicks</span>
            <span className="font-bold">{Math.round(payload[0].value as number)}</span>
          </div>
        </div>
      </div>
    )
  }
  return null
}

export function LinkClicksChart() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/affiliate/clicks")

        if (!response.ok) {
          throw new Error("Failed to fetch click data")
        }

        const result = await response.json()

        if (result.clicks && Array.isArray(result.clicks)) {
          // For clicks, we just want to count them, so we need to set a count field
          const clicksWithCount = result.clicks.map((click: AffiliateClick) => ({
            ...click,
            count: 1,
          }))

          // Group by month and count clicks
          const monthlyData = groupDataByMonth(clicksWithCount, "createdAt", "count")

          setData(monthlyData)
        } else {
          setData([])
        }
      } catch (err) {
        console.error("Error fetching click data:", err)
        setError("Failed to load click data")
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
          <CardTitle>Link Clicks</CardTitle>
          <CardDescription>Total clicks on your affiliate links over the past 6 months</CardDescription>
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
          <CardTitle>Link Clicks</CardTitle>
          <CardDescription>Total clicks on your affiliate links over the past 6 months</CardDescription>
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
        <CardTitle>Link Clicks</CardTitle>
        <CardDescription>Total clicks on your affiliate links over the past 6 months</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            value: {
              label: "Clicks",
              color: "hsl(var(--chart-2))",
            },
          }}
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis dataKey="month" tickLine={false} axisLine={false} padding={{ left: 10, right: 10 }} />
              <YAxis
                tickFormatter={(value) => `${Math.round(value)}`}
                tickLine={false}
                axisLine={false}
                tickCount={5}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="value" strokeWidth={2} activeDot={{ r: 6 }} stroke="var(--color-value)" />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

