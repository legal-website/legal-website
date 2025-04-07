"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Clock } from "lucide-react"

export default function BeneficialOwnershipMigrationPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [detailedError, setDetailedError] = useState<string | null>(null)

  const runMigration = async () => {
    if (
      !confirm(
        "Are you sure you want to run the beneficial ownership migration? This will create default ownership records for all users who don't have one.",
      )
    ) {
      return
    }

    setIsLoading(true)
    setError(null)
    setDetailedError(null)
    setResult(null)

    try {
      const response = await fetch("/api/admin/beneficial-ownership/migrate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            "Unauthorized: You don't have permission to run this migration. Please ensure you have admin privileges.",
          )
        }
        throw new Error(data.error || "Failed to run migration")
      }

      setResult(data)
    } catch (err) {
      setError((err as Error).message)
      // Log detailed error for debugging
      console.error("Migration error:", err)
      setDetailedError(JSON.stringify(err, null, 2))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Beneficial Ownership Migration</CardTitle>
          <CardDescription>
            This tool will create default beneficial ownership records (100% ownership) for all users who don't already
            have one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                This operation is safe to run multiple times. It will only create records for users who don't already
                have a default beneficial owner record.
              </AlertDescription>
            </Alert>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {error}
                  {detailedError && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm">Technical Details</summary>
                      <pre className="mt-2 whitespace-pre-wrap text-xs bg-gray-100 p-2 rounded">{detailedError}</pre>
                    </details>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {result && (
              <div className="rounded-md bg-green-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-green-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Migration completed successfully</h3>
                    <div className="mt-2 text-sm text-green-700">
                      <ul className="list-disc space-y-1 pl-5">
                        <li>Total users: {result.stats.totalUsers}</li>
                        <li>Users with existing records: {result.stats.usersWithExistingRecords}</li>
                        <li>Users with new records created: {result.stats.usersWithNewRecords}</li>
                        <li>Failed users: {result.stats.failedUsers}</li>
                      </ul>
                    </div>
                    {result.stats.errors && result.stats.errors.length > 0 && (
                      <div className="mt-2">
                        <details>
                          <summary className="text-sm font-medium text-green-800 cursor-pointer">
                            View errors ({result.stats.errors.length})
                          </summary>
                          <div className="mt-2 max-h-40 overflow-y-auto">
                            <ul className="list-disc space-y-1 pl-5">
                              {result.stats.errors.map((err: any, index: number) => (
                                <li key={index} className="text-sm text-red-600">
                                  User {err.userId}: {err.error}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={runMigration} disabled={isLoading}>
            {isLoading ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Running Migration...
              </>
            ) : (
              "Run Migration"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

