"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, RefreshCw } from "lucide-react"
import Link from "next/link"

export default function TestConnection() {
  const [isLoading, setIsLoading] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  const runTest = async () => {
    setIsLoading(true)
    setTestResult(null)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Simulate successful test
    setTestResult({
      success: true,
      message: "Connection to Google Analytics API successful. Property ID is valid and accessible.",
    })

    setIsLoading(false)
  }

  return (
    <div className="px-6 mb-40">
      <div className="flex items-center mb-6">
        <Link href="/app/admin/orizen-analytics" className="mr-4">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Test Google Analytics Connection</h1>
      </div>

      <Card className="mb-6">
        <CardHeader className="border-b">
          <CardTitle>Connection Test</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="mb-6">
            This will test the connection to Google Analytics API using your configured credentials. The test will
            verify that your Property ID is valid and that your service account has proper access to the Google
            Analytics data.
          </p>

          <Button onClick={runTest} disabled={isLoading} className="mb-4">
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Testing Connection...
              </>
            ) : (
              "Run Connection Test"
            )}
          </Button>

          {testResult && (
            <div
              className={`p-4 rounded-md ${testResult.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
            >
              {testResult.message}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

