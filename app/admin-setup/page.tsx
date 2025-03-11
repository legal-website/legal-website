"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"

export default function AdminSetupPage() {
  const [setupKey, setSetupKey] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success?: boolean
    message?: string
    action?: string
    loginEmail?: string
    loginPassword?: string
    error?: string
  } | null>(null)
  const { toast } = useToast()

  const handleSetup = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch(`/api/setup/admin?key=${setupKey}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to set up admin account")
      }

      setResult(data)
      toast({
        title: "Success",
        description: data.message,
      })
    } catch (error: any) {
      setResult({ success: false, error: error.message })
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Admin Account Setup</CardTitle>
          <CardDescription>Set up the default admin account for your application.</CardDescription>
        </CardHeader>
        <CardContent>
          {!result ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="setupKey">Setup Key</Label>
                <Input
                  id="setupKey"
                  value={setupKey}
                  onChange={(e) => setSetupKey(e.target.value)}
                  placeholder="Enter setup key"
                />
                <p className="text-sm text-gray-500">
                  If no ADMIN_SETUP_KEY environment variable is set, use: "setup-orizen-admin-account"
                </p>
              </div>
            </div>
          ) : result.success ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Admin account {result.action}</span>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md border border-green-100 dark:border-green-800">
                <h3 className="font-medium mb-2">Login Credentials</h3>
                <p className="mb-1">Email: {result.loginEmail}</p>
                <p>Password: {result.loginPassword}</p>
              </div>
              <p className="text-sm text-gray-500">
                Please save these credentials in a secure location. You can now log in to the admin dashboard.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Setup failed</span>
              </div>
              <p className="text-sm">{result.error}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          {!result ? (
            <Button onClick={handleSetup} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                "Set Up Admin Account"
              )}
            </Button>
          ) : result.success ? (
            <Link href="/login">
              <Button>Go to Login</Button>
            </Link>
          ) : (
            <Button onClick={() => setResult(null)}>Try Again</Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

