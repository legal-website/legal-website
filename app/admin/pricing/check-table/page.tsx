"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"

export default function CheckPricingTablePage() {
  const [status, setStatus] = useState<"loading" | "exists" | "created" | "error">("loading")
  const [message, setMessage] = useState("Checking if PricingSettings table exists...")
  const [error, setError] = useState<string | null>(null)

  const checkTable = async () => {
    setStatus("loading")
    setMessage("Checking if PricingSettings table exists...")
    setError(null)

    try {
      const response = await fetch("/api/pricing/check-table")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to check table")
      }

      if (data.exists) {
        setStatus("exists")
        setMessage("PricingSettings table exists in the database.")
      } else if (data.created) {
        setStatus("created")
        setMessage("PricingSettings table was created successfully.")
      } else {
        throw new Error("Unexpected response from server")
      }
    } catch (err) {
      setStatus("error")
      setMessage("Error checking or creating PricingSettings table.")
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  useEffect(() => {
    checkTable()
  }, [])

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>PricingSettings Table Status</CardTitle>
          <CardDescription>Check if the PricingSettings table exists in your database</CardDescription>
        </CardHeader>
        <CardContent>
          {status === "loading" && (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
              <p>{message}</p>
            </div>
          )}

          {status === "exists" && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <AlertTitle className="text-green-700">Table Exists</AlertTitle>
              <AlertDescription className="text-green-600">{message}</AlertDescription>
            </Alert>
          )}

          {status === "created" && (
            <Alert className="bg-blue-50 border-blue-200">
              <CheckCircle className="h-5 w-5 text-blue-500" />
              <AlertTitle className="text-blue-700">Table Created</AlertTitle>
              <AlertDescription className="text-blue-600">{message}</AlertDescription>
            </Alert>
          )}

          {status === "error" && (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <AlertTitle className="text-red-700">Error</AlertTitle>
              <AlertDescription className="text-red-600">
                {message}
                {error && <div className="mt-2 text-sm bg-red-100 p-2 rounded">{error}</div>}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={checkTable} disabled={status === "loading"} className="w-full">
            {status === "loading" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              "Check Table Again"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

