"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { RefreshCwIcon as ReloadIcon, CheckCircleIcon, AlertCircleIcon } from "lucide-react"

export default function PricingDebugPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)
  const [migrationStatus, setMigrationStatus] = useState<{
    loading: boolean
    success?: boolean
    message?: string
  }>({ loading: false })

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Add cache-busting parameter
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/pricing/debug?t=${timestamp}`, {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`)
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const runMigration = async () => {
    try {
      setMigrationStatus({ loading: true })

      const response = await fetch("/api/pricing/migrate", {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      const result = await response.json()

      setMigrationStatus({
        loading: false,
        success: response.ok,
        message: result.message || (response.ok ? "Migration completed successfully" : "Migration failed"),
      })

      // Refresh data after migration
      if (response.ok) {
        setTimeout(fetchData, 500)
      }
    } catch (err) {
      setMigrationStatus({
        loading: false,
        success: false,
        message: err instanceof Error ? err.message : String(err),
      })
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div className="container py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pricing Debug</h1>
          <p className="text-muted-foreground">View and debug pricing data in the database</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            {loading ? <ReloadIcon className="mr-2 h-4 w-4 animate-spin" /> : <ReloadIcon className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
          <Button onClick={runMigration} disabled={migrationStatus.loading}>
            {migrationStatus.loading ? <ReloadIcon className="mr-2 h-4 w-4 animate-spin" /> : null}
            Run Migration
          </Button>
        </div>
      </div>

      {migrationStatus.message && (
        <Alert variant={migrationStatus.success ? "default" : "destructive"}>
          {migrationStatus.success ? <CheckCircleIcon className="h-4 w-4" /> : <AlertCircleIcon className="h-4 w-4" />}
          <AlertTitle>Migration Status</AlertTitle>
          <AlertDescription>{migrationStatus.message}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Database Status</CardTitle>
          <CardDescription>Information about the PricingSettings table</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-4">
              <ReloadIcon className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : data ? (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="font-semibold">Table Exists:</p>
                  <p>{data.tableExists ? "Yes" : "No"}</p>
                </div>
                <div>
                  <p className="font-semibold">Row Count:</p>
                  <p>{data.rowCount || 0}</p>
                </div>
              </div>
            </>
          ) : (
            <p>No data available</p>
          )}
        </CardContent>
      </Card>

      {data && data.data && data.data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pricing Data Entries</CardTitle>
            <CardDescription>Records in the PricingSettings table</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Updated At</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Plans</TableHead>
                    <TableHead>State Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.id}</TableCell>
                      <TableCell>{item.key}</TableCell>
                      <TableCell>{new Date(item.createdAt).toLocaleString()}</TableCell>
                      <TableCell>{new Date(item.updatedAt).toLocaleString()}</TableCell>
                      <TableCell>{item.version || "N/A"}</TableCell>
                      <TableCell>{item.plans || "N/A"}</TableCell>
                      <TableCell>{item.stateCount || "N/A"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

