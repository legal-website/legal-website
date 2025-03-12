"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const token = searchParams ? searchParams.get("token") : null
        const redirect = searchParams ? searchParams.get("redirect") : "/login"

        if (!token) {
          setStatus("error")
          setMessage("Verification token is missing")
          return
        }

        // The API will handle the verification and redirect
        // This page will only be shown momentarily
        router.push(`/api/auth/verify-email?token=${token}&redirect=${redirect || "/login"}`)
      } catch (error) {
        console.error("Error verifying email:", error)
        setStatus("error")
        setMessage("Failed to verify your email. Please try again or contact support.")
      }
    }

    verifyToken()
  }, [searchParams, router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Email Verification</CardTitle>
          <CardDescription>
            {status === "loading"
              ? "Verifying your email address..."
              : status === "success"
                ? "Your email has been verified!"
                : "Verification failed"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === "loading" && (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          )}
          {status === "success" && (
            <p className="text-green-600 dark:text-green-400">
              Your email has been successfully verified. You can now log in to your account.
            </p>
          )}
          {status === "error" && <p className="text-red-600 dark:text-red-400">{message}</p>}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={() => router.push("/login")} disabled={status === "loading"}>
            Go to Login
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

