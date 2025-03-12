"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle } from "lucide-react"

export default function ApiTestPage() {
  const [testResult, setTestResult] = useState<any>(null)
  const [usersResult, setUsersResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testApi = async () => {
    setLoading(true)
    setError(null)

    try {
      // Test the simple test API first
      const testResponse = await fetch("/api/test")
      const testData = await testResponse.json()
      setTestResult(testData)

      // Now test the users API
      try {
        const usersResponse = await fetch("/api/users", {
          headers: {
            Accept: "application/json",
          },
        })

        // Check if the response is JSON
        const contentType = usersResponse.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          const usersData = await usersResponse.json()
          setUsersResult(usersData)
        } else {
          // If not JSON, get the text
          const text = await usersResponse.text()
          setUsersResult({
            error: "Non-JSON response",
            status: usersResponse.status,
            statusText: usersResponse.statusText,
            contentType,
            text: text.substring(0, 500) + (text.length > 500 ? "..." : ""),
          })
        }
      } catch (usersError: any) {
        setUsersResult({
          error: usersError.message,
          stack: usersError.stack,
        })
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">API Test Page</h1>

      <div className="grid gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>API Test</CardTitle>
            <CardDescription>Test the API endpoints to diagnose issues</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={testApi} disabled={loading}>
              {loading ? "Testing..." : "Run API Tests"}
            </Button>
          </CardContent>
          {(testResult || error) && (
            <CardFooter className="flex flex-col items-start">
              <h3 className="font-medium mb-2">Test API Result:</h3>
              {error ? (
                <div className="bg-red-50 p-4 rounded-md text-red-800 w-full">
                  <div className="flex items-center mb-2">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <span className="font-medium">Error</span>
                  </div>
                  <p>{error}</p>
                </div>
              ) : (
                <div className="bg-green-50 p-4 rounded-md text-green-800 w-full">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    <span className="font-medium">Success</span>
                  </div>
                  <pre className="overflow-auto text-xs">{JSON.stringify(testResult, null, 2)}</pre>
                </div>
              )}

              {usersResult && (
                <>
                  <h3 className="font-medium mt-4 mb-2">Users API Result:</h3>
                  {usersResult.error ? (
                    <div className="bg-red-50 p-4 rounded-md text-red-800 w-full">
                      <div className="flex items-center mb-2">
                        <AlertCircle className="h-5 w-5 mr-2" />
                        <span className="font-medium">Error</span>
                      </div>
                      <p>{usersResult.error}</p>
                      {usersResult.text && (
                        <div className="mt-2">
                          <p className="font-medium">Response Text:</p>
                          <pre className="overflow-auto text-xs mt-1 bg-gray-100 p-2 rounded">{usersResult.text}</pre>
                        </div>
                      )}
                      {usersResult.status && (
                        <p className="mt-2">
                          Status: {usersResult.status} {usersResult.statusText}
                        </p>
                      )}
                      {usersResult.contentType && <p className="mt-2">Content-Type: {usersResult.contentType}</p>}
                    </div>
                  ) : (
                    <div className="bg-green-50 p-4 rounded-md text-green-800 w-full">
                      <div className="flex items-center mb-2">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        <span className="font-medium">Success</span>
                      </div>
                      <pre className="overflow-auto text-xs">{JSON.stringify(usersResult, null, 2)}</pre>
                    </div>
                  )}
                </>
              )}
            </CardFooter>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Authentication Issues:</strong> Make sure you're logged in as an admin user. The users API
              requires admin privileges.
            </li>
            <li>
              <strong>CORS Issues:</strong> If you see CORS errors, make sure your API routes are properly configured to
              handle cross-origin requests.
            </li>
            <li>
              <strong>Content Type:</strong> Check if the API is returning the correct Content-Type header
              (application/json).
            </li>
            <li>
              <strong>Server Errors:</strong> Look for 500 status codes which indicate server-side errors.
            </li>
            <li>
              <strong>Response Format:</strong> Ensure the API is returning data in the expected format.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

