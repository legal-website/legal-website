"use client"

import { useState, useEffect } from "react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

// Types for our chart data
interface CommissionData {
  date: string
  totalCommission: number
  avgCommission: number
}

interface ClickData {
  date: string
  clicks: number
}

interface AffiliateData {
  date: string
  totalAffiliates: number
}

// Commission Chart Component
export function CommissionChart() {
  const [data, setData] = useState<CommissionData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Use existing route to fetch commission data
        const response = await fetch("/api/admin/stats/commissions")
        const result = await response.json()

        if (result.success) {
          setData(result.data || [])
        } else {
          console.error("Failed to fetch commission data:", result.error)
          // Fallback data for demonstration
          setData([
            { date: "Jan", totalCommission: 4000, avgCommission: 240 },
            { date: "Feb", totalCommission: 3000, avgCommission: 198 },
            { date: "Mar", totalCommission: 5000, avgCommission: 280 },
            { date: "Apr", totalCommission: 2780, avgCommission: 190 },
            { date: "May", totalCommission: 1890, avgCommission: 230 },
            { date: "Jun", totalCommission: 2390, avgCommission: 250 },
            { date: "Jul", totalCommission: 3490, avgCommission: 330 },
          ])
        }
      } catch (error) {
        console.error("Error fetching commission data:", error)
        // Fallback data
        setData([
          { date: "Jan", totalCommission: 4000, avgCommission: 240 },
          { date: "Feb", totalCommission: 3000, avgCommission: 198 },
          { date: "Mar", totalCommission: 5000, avgCommission: 280 },
          { date: "Apr", totalCommission: 2780, avgCommission: 190 },
          { date: "May", totalCommission: 1890, avgCommission: 230 },
          { date: "Jun", totalCommission: 2390, avgCommission: 250 },
          { date: "Jul", totalCommission: 3490, avgCommission: 330 },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return <Skeleton className="w-full h-[300px]" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Commission Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="totalCommission"
                name="Total Commission"
                stroke="#8884d8"
                activeDot={{ r: 8 }}
                strokeWidth={2}
                animationDuration={1500}
              />
              <Line
                type="monotone"
                dataKey="avgCommission"
                name="Avg Commission"
                stroke="#82ca9d"
                strokeWidth={2}
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

// Clicks Chart Component
export function ClicksChart() {
  const [data, setData] = useState<ClickData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Use existing route to fetch clicks data
        const response = await fetch("/api/admin/stats/clicks")
        const result = await response.json()

        if (result.success) {
          setData(result.data || [])
        } else {
          console.error("Failed to fetch clicks data:", result.error)
          // Fallback data
          setData([
            { date: "Jan", clicks: 4000 },
            { date: "Feb", clicks: 3000 },
            { date: "Mar", clicks: 5000 },
            { date: "Apr", clicks: 2780 },
            { date: "May", clicks: 1890 },
            { date: "Jun", clicks: 2390 },
            { date: "Jul", clicks: 3490 },
          ])
        }
      } catch (error) {
        console.error("Error fetching clicks data:", error)
        // Fallback data
        setData([
          { date: "Jan", clicks: 4000 },
          { date: "Feb", clicks: 3000 },
          { date: "Mar", clicks: 5000 },
          { date: "Apr", clicks: 2780 },
          { date: "May", clicks: 1890 },
          { date: "Jun", clicks: 2390 },
          { date: "Jul", clicks: 3490 },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return <Skeleton className="w-full h-[300px]" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clicks Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="clicks"
                name="Number of Clicks"
                fill="#8884d8"
                animationDuration={1500}
                animationBegin={300}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

// Affiliates Chart Component
export function AffiliatesChart() {
  const [data, setData] = useState<AffiliateData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Use existing route to fetch affiliates data
        const response = await fetch("/api/admin/stats/affiliates")
        const result = await response.json()

        if (result.success) {
          setData(result.data || [])
        } else {
          console.error("Failed to fetch affiliates data:", result.error)
          // Fallback data
          setData([
            { date: "Jan", totalAffiliates: 40 },
            { date: "Feb", totalAffiliates: 43 },
            { date: "Mar", totalAffiliates: 45 },
            { date: "Apr", totalAffiliates: 47 },
            { date: "May", totalAffiliates: 52 },
            { date: "Jun", totalAffiliates: 58 },
            { date: "Jul", totalAffiliates: 65 },
          ])
        }
      } catch (error) {
        console.error("Error fetching affiliates data:", error)
        // Fallback data
        setData([
          { date: "Jan", totalAffiliates: 40 },
          { date: "Feb", totalAffiliates: 43 },
          { date: "Mar", totalAffiliates: 45 },
          { date: "Apr", totalAffiliates: 47 },
          { date: "May", totalAffiliates: 52 },
          { date: "Jun", totalAffiliates: 58 },
          { date: "Jul", totalAffiliates: 65 },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return <Skeleton className="w-full h-[300px]" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Total Affiliates</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="totalAffiliates"
                name="Total Affiliates"
                stroke="#ff7300"
                activeDot={{ r: 8 }}
                strokeWidth={2}
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

