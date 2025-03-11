"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DirectTest() {
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleTest = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // Simple test data
      const testData = {
        customer: {
          name: "Test Customer",
          email: "test@example.com",
        },
        items: [
          {
            id: "test-item",
            tier: "BASIC",
            price: 99.99,
          },
        ],
        total: 99.99,
      }

      // Make the request
      const response = await fetch("/api/direct-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testData),
      })

      // Get the raw response text
      const responseText = await response.text()
      console.log("Raw response:", responseText)

      // Try to parse as JSON
      try {
        const data = JSON.parse(responseText)
        setResult(data)

        if (data.error) {
          setError(data.error)
        } else if (!data.invoice) {
          setError("No invoice returned from server")
        } else {
          console.log("Success! Invoice ID:", data.invoice.id)
        }
      } catch (parseError) {
        setError("Failed to parse response as JSON")
        console.error("Parse error:", parseError)
      }
    } catch (fetchError: any) {
      setError(fetchError.message || "An error occurred")
      console.error("Fetch error:", fetchError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Direct Checkout Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleTest} disabled={loading} className="w-full">
            {loading ? "Testing..." : "Run Direct Test"}
          </Button>

          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-md">
              <p className="font-medium">Error:</p>
              <p>{error}</p>
            </div>
          )}

          {result && !error && (
            <div className="p-4 bg-green-50 text-green-700 rounded-md">
              <p className="font-medium">Success!</p>
              <p>Invoice ID: {result.invoice?.id}</p>
            </div>
          )}

          {result && (
            <div className="mt-4">
              <p className="font-medium mb-2">Full Response:</p>
              <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-xs">{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

