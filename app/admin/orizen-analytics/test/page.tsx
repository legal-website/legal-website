"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react"

export default function AnalyticsTestPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testConnection = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/admin/analytics/test-connection")
      const data = await response.json()
      setResult(data)
    } catch (err: any) {
      setError(err.message || "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    testConnection()
  }, [])

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Google Analytics Connection Test</CardTitle>
          <CardDescription>
            This page tests the connection to Google Analytics and helps diagnose any issues.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center p-6">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Testing connection...</span>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : result ? (
            <>
              <div className="flex items-start gap-4">
                {result.success ? (
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-500 mt-1 flex-shrink-0" />
                )}
                <div>
                  <h3 className="text-lg font-medium">
                    {result.success ? "Connection Successful" : "Connection Failed"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {result.success
                      ? "Successfully connected to Google Analytics API."
                      : `Failed at stage: ${result.stage}. Error: ${result.error}`}
                  </p>
                </div>
              </div>

              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2">Environment Variables Check</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center">
                    <span className="text-sm">Google Client Email:</span>
                  </div>
                  <div className="flex items-center">
                    {result.envCheck?.hasClientEmail ? (
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500 mr-2" />
                    )}
                    <span className="text-sm">{result.envCheck?.hasClientEmail ? "Present" : "Missing"}</span>
                  </div>

                  <div className="flex items-center">
                    <span className="text-sm">Google Private Key:</span>
                  </div>
                  <div className="flex items-center">
                    {result.envCheck?.hasPrivateKey ? (
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500 mr-2" />
                    )}
                    <span className="text-sm">{result.envCheck?.hasPrivateKey ? "Present" : "Missing"}</span>
                  </div>

                  <div className="flex items-center">
                    <span className="text-sm">Google Analytics View ID:</span>
                  </div>
                  <div className="flex items-center">
                    {result.envCheck?.hasViewId ? (
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500 mr-2" />
                    )}
                    <span className="text-sm">
                      {result.envCheck?.hasViewId ? `Present (${result.envCheck?.viewIdValue})` : "Missing"}
                    </span>
                  </div>
                </div>
              </div>

              {result.success && (
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-2">Data Check</h3>
                  <div className="flex items-center mb-4">
                    {result.hasData ? (
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
                    )}
                    <span className="text-sm">
                      {result.hasData
                        ? "Data is available in the specified view"
                        : "No data found in the specified view"}
                    </span>
                  </div>

                  {result.hasData && result.sampleData && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Sample Data:</h4>
                      <pre className="bg-muted p-2 rounded text-xs overflow-auto">
                        {JSON.stringify(result.sampleData, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : null}
        </CardContent>
        <CardFooter>
          <Button onClick={testConnection} disabled={loading} className="w-full">
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              "Test Connection Again"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

