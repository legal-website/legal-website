"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, AlertCircle } from "lucide-react"

export default function PricingDebugPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugData, setDebugData] = useState<any>(null)

  const fetchDebugData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/pricing/debug", {
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch debug data: ${response.status}`)
      }

      const data = await response.json()
      setDebugData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const runMigration = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/pricing/migrate")

      if (!response.ok) {
        throw new Error(`Failed to run migration: ${response.status}`)
      }

      const data = await response.json()
      alert(data.message || "Migration completed")

      // Refresh debug data after migration
      fetchDebugData()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDebugData()
  }, [])

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Pricing Debug</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">View and debug pricing data in the database</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <Button variant="outline" size="sm" className="flex items-center" onClick={fetchDebugData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="default" size="sm" onClick={runMigration} disabled={loading}>
            Run Migration
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Error</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Database Status</CardTitle>
              <CardDescription>Information about the PricingSettings table</CardDescription>
            </CardHeader>
            <CardContent>
              {debugData ? (
                <div>
                  <p>
                    <strong>Table Exists:</strong> {debugData.tableExists ? "Yes" : "No"}
                  </p>
                  {debugData.tableExists && (
                    <p>
                      <strong>Row Count:</strong> {debugData.rowCount}
                    </p>
                  )}
                  {debugData.error && (
                    <div className="mt-4 p-4 bg-red-50 text-red-700 rounded">
                      <p>
                        <strong>Error:</strong> {debugData.error}
                      </p>
                      {debugData.details && (
                        <p>
                          <strong>Details:</strong> {debugData.details}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p>No data available</p>
              )}
            </CardContent>
          </Card>

          {debugData?.data && debugData.data.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Pricing Data Entries</CardTitle>
                <CardDescription>Records in the PricingSettings table</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium text-sm">ID</th>
                        <th className="text-left p-2 font-medium text-sm">Key</th>
                        <th className="text-left p-2 font-medium text-sm">Created At</th>
                        <th className="text-left p-2 font-medium text-sm">Updated At</th>
                        <th className="text-left p-2 font-medium text-sm">Plans</th>
                        <th className="text-left p-2 font-medium text-sm">State Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {debugData.data.map((item: any) => (
                        <tr key={item.id} className="border-b">
                          <td className="p-2">{item.id}</td>
                          <td className="p-2">{item.key}</td>
                          <td className="p-2">{new Date(item.createdAt).toLocaleString()}</td>
                          <td className="p-2">{new Date(item.updatedAt).toLocaleString()}</td>
                          <td className="p-2">{item.plans || "N/A"}</td>
                          <td className="p-2">{item.stateCount || "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

