"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, DollarSign, Users, BarChart, Link } from "lucide-react"

export default function AffiliateDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tablesExist, setTablesExist] = useState<any>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/affiliate/stats")

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to fetch affiliate stats")
      }

      const data = await response.json()
      setStats(data.stats)
      setTablesExist(data.tablesExist)
      setError(null)
    } catch (err: any) {
      console.error("Error fetching affiliate stats:", err)
      setError(err.message || "Failed to fetch affiliate stats")
    } finally {
      setLoading(false)
    }
  }

  const createTables = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/affiliate/create-tables", {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create affiliate tables")
      }

      await fetchStats()
    } catch (err: any) {
      console.error("Error creating affiliate tables:", err)
      setError(err.message || "Failed to create affiliate tables")
    } finally {
      setLoading(false)
    }
  }

  const fixSchema = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/affiliate/fix-schema", {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to fix affiliate schema")
      }

      await fetchStats()
    } catch (err: any) {
      console.error("Error fixing affiliate schema:", err)
      setError(err.message || "Failed to fix affiliate schema")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">Loading affiliate stats...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>

        <div className="flex gap-4 mt-4">
          <Button onClick={createTables}>Create Affiliate Tables</Button>
          <Button onClick={fixSchema}>Fix Schema</Button>
          <Button onClick={fetchStats}>Retry</Button>
        </div>
      </div>
    )
  }

  if (
    tablesExist &&
    (!tablesExist.affiliate_links || !tablesExist.affiliate_conversions || !tablesExist.affiliate_clicks)
  ) {
    return (
      <div className="container mx-auto p-4">
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Missing Tables</AlertTitle>
          <AlertDescription>
            Some affiliate tables are missing:
            {!tablesExist.affiliate_links && <div>- affiliate_links</div>}
            {!tablesExist.affiliate_conversions && <div>- affiliate_conversions</div>}
            {!tablesExist.affiliate_clicks && <div>- affiliate_clicks</div>}
          </AlertDescription>
        </Alert>

        <Button onClick={createTables}>Create Affiliate Tables</Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Affiliate Dashboard</h1>
        <Button onClick={fetchStats}>Refresh</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Links</CardTitle>
            <Link className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLinks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClicks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalCommission.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="conversions" className="w-full">
        <TabsList>
          <TabsTrigger value="conversions">Recent Conversions</TabsTrigger>
          <TabsTrigger value="clicks">Recent Clicks</TabsTrigger>
          <TabsTrigger value="affiliates">Top Affiliates</TabsTrigger>
        </TabsList>

        <TabsContent value="conversions">
          <Card>
            <CardHeader>
              <CardTitle>Recent Conversions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">Customer</th>
                      <th className="text-left p-2">Affiliate</th>
                      <th className="text-left p-2">Amount</th>
                      <th className="text-left p-2">Commission</th>
                      <th className="text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentConversions.length > 0 ? (
                      stats.recentConversions.map((conversion: any) => (
                        <tr key={conversion.id} className="border-b">
                          <td className="p-2">{new Date(conversion.createdAt).toLocaleDateString()}</td>
                          <td className="p-2">{conversion.customerEmail || "Unknown"}</td>
                          <td className="p-2">{conversion.affiliateEmail}</td>
                          <td className="p-2">${Number.parseFloat(conversion.amount).toFixed(2)}</td>
                          <td className="p-2">${Number.parseFloat(conversion.commission).toFixed(2)}</td>
                          <td className="p-2">
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                conversion.status === "PENDING"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : conversion.status === "APPROVED"
                                    ? "bg-green-100 text-green-800"
                                    : conversion.status === "REJECTED"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {conversion.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-4 text-center">
                          No conversions found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clicks">
          <Card>
            <CardHeader>
              <CardTitle>Recent Clicks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">Affiliate</th>
                      <th className="text-left p-2">IP</th>
                      <th className="text-left p-2">User Agent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentClicks.length > 0 ? (
                      stats.recentClicks.map((click: any) => (
                        <tr key={click.id} className="border-b">
                          <td className="p-2">{new Date(click.createdAt).toLocaleDateString()}</td>
                          <td className="p-2">{click.affiliateEmail}</td>
                          <td className="p-2">{click.ip || "Unknown"}</td>
                          <td className="p-2 truncate max-w-xs">{click.userAgent || "Unknown"}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-4 text-center">
                          No clicks found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="affiliates">
          <Card>
            <CardHeader>
              <CardTitle>Top Affiliates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Affiliate</th>
                      <th className="text-left p-2">Conversions</th>
                      <th className="text-left p-2">Total Commission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topAffiliates.length > 0 ? (
                      stats.topAffiliates.map((affiliate: any) => (
                        <tr key={affiliate.userId} className="border-b">
                          <td className="p-2">{affiliate.email}</td>
                          <td className="p-2">{affiliate.conversions}</td>
                          <td className="p-2">${Number.parseFloat(affiliate.totalCommission).toFixed(2)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="p-4 text-center">
                          No affiliates found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

