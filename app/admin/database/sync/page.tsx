"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"

export default function DatabaseSyncPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedTables, setSelectedTables] = useState({
    BankAccount: true,
    PaymentMethod: false,
  })

  const handleSync = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const tables = Object.entries(selectedTables)
        .filter(([_, selected]) => selected)
        .map(([table]) => table)

      if (tables.length === 0) {
        setError("Please select at least one table to sync")
        setLoading(false)
        return
      }

      const response = await fetch("/api/admin/database/sync-schema", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tables }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to sync database schema")
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleSyncSingle = async (table: string) => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch(`/api/admin/database/sync-schema?table=${table}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to sync database schema")
      }

      setResult({ results: { [table]: data } })
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Database Schema Synchronization</h1>

      <div className="grid gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Sync Database Schema</CardTitle>
            <CardDescription>
              This tool will add missing columns to your database tables to match your Prisma schema. Use with caution
              in production environments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="BankAccount"
                  checked={selectedTables.BankAccount}
                  onCheckedChange={(checked) => setSelectedTables((prev) => ({ ...prev, BankAccount: !!checked }))}
                />
                <label
                  htmlFor="BankAccount"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  BankAccount
                </label>
                <Button variant="outline" size="sm" onClick={() => handleSyncSingle("BankAccount")} disabled={loading}>
                  Sync Now
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="PaymentMethod"
                  checked={selectedTables.PaymentMethod}
                  onCheckedChange={(checked) => setSelectedTables((prev) => ({ ...prev, PaymentMethod: !!checked }))}
                />
                <label
                  htmlFor="PaymentMethod"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  PaymentMethod
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSyncSingle("PaymentMethod")}
                  disabled={loading}
                >
                  Sync Now
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSync} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                "Sync Selected Tables"
              )}
            </Button>
          </CardFooter>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                Sync Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(result.results || {}).map(([table, tableResult]: [string, any]) => (
                  <div key={table} className="border rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-2">{table}</h3>

                    {tableResult.missingColumns?.length > 0 ? (
                      <>
                        <p className="text-sm mb-2">Added columns:</p>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {tableResult.alterResults.map((result: any) => (
                            <li key={result.column} className={result.success ? "text-green-600" : "text-red-600"}>
                              {result.column}: {result.status}
                              {!result.success && result.error && (
                                <span className="block ml-6 text-xs">{result.error}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">No missing columns found.</p>
                    )}

                    <div className="mt-4">
                      <p className="text-sm mb-1">Current columns:</p>
                      <div className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                        {tableResult.currentColumns?.join(", ")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

