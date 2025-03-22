"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, XCircle, Database, RefreshCw } from "lucide-react"

export default function AffiliateTables() {
  const [tables, setTables] = useState<{ [key: string]: boolean } | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const checkTables = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/affiliate/check-tables")
      const data = await res.json()
      if (data.success) {
        setTables(data.tables)
      } else {
        setMessage({ type: "error", text: "Failed to check tables" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred while checking tables" })
    } finally {
      setLoading(false)
    }
  }

  const createTables = async () => {
    setCreating(true)
    setMessage(null)
    try {
      const res = await fetch("/api/admin/affiliate/create-tables", {
        method: "POST",
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: "success", text: "Tables created successfully" })
        checkTables()
      } else {
        setMessage({ type: "error", text: data.error || "Failed to create tables" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred while creating tables" })
    } finally {
      setCreating(false)
    }
  }

  useEffect(() => {
    checkTables()
  }, [])

  return (
    <div className="container mx-auto py-10">
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-6 w-6" />
            Affiliate System Tables
          </CardTitle>
          <CardDescription>Manage the database tables required for the affiliate system</CardDescription>
        </CardHeader>
        <CardContent>
          {message && (
            <Alert
              className={`mb-6 ${message.type === "success" ? "bg-green-50 text-green-800 border-green-200" : "bg-red-50 text-red-800 border-red-200"}`}
            >
              <AlertTitle>{message.type === "success" ? "Success" : "Error"}</AlertTitle>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Table Status</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={checkTables}
                disabled={loading}
                className="flex items-center gap-1"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-4">Loading table information...</div>
            ) : (
              <div className="border rounded-md divide-y">
                {tables &&
                  Object.entries(tables).map(([table, exists]) => (
                    <div key={table} className="flex justify-between items-center p-3">
                      <span className="font-mono text-sm">{table}</span>
                      <span className="flex items-center gap-1">
                        {exists ? (
                          <>
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <span className="text-green-600">Exists</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-5 w-5 text-red-500" />
                            <span className="text-red-600">Missing</span>
                          </>
                        )}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button
            onClick={createTables}
            disabled={creating || (tables && Object.values(tables).every((exists) => exists))}
          >
            {creating ? "Creating Tables..." : "Create Missing Tables"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

