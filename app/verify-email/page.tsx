"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react"

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error" | "waiting">("loading")
  const [message, setMessage] = useState("")

  // Get email and token from URL parameters
  const email = searchParams?.get("email") || ""
  const token = searchParams?.get("token") || ""
  const redirect = searchParams?.get("redirect") || "/login"
  const verified = searchParams?.get("verified") === "true"
  const error = searchParams?.get("error")

  useEffect(() => {
    // Check if we're returning from a verification redirect
    if (verified) {
      setStatus("success")
      setMessage("Your email has been successfully verified. You can now log in to your account.")
      // Auto-redirect after 3 seconds
      setTimeout(() => {
        router.push("/login")
      }, 3000)
      return
    }

    // Check if there's an error from redirect
    if (error) {
      setStatus("error")
      let errorMessage = "Failed to verify your email. Please try again or contact support."

      if (error === "missing_token") {
        errorMessage = "Verification token is missing. Please check your email link and try again."
      } else if (error === "invalid_token") {
        errorMessage = "Invalid or expired verification token. Please request a new verification email."
      }

      setMessage(errorMessage)
      return
    }

    // If we have a token, try to verify it
    if (token) {
      // Instead of making a fetch request, redirect to the API route
      // The API will handle verification and redirect back with success/error params
      window.location.href = `/api/auth/verify-email?token=${token}&redirect=/verify-email`
    }
    // If we only have an email, show the "check your inbox" message
    else if (email) {
      setStatus("waiting")
      setMessage(
        `We've sent a verification link to ${email}. Please check your inbox and click the link to verify your account.`,
      )
    }
    // If we have neither, show an error
    else {
      setStatus("error")
      setMessage("No email or verification token provided. Please check your email link and try again.")
    }
  }, [email, token, redirect, verified, error, router])

  const resendVerificationEmail = async () => {
    if (!email) return

    setStatus("loading")
    setMessage("Resending verification email...")

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus("waiting")
        setMessage(`Verification email resent to ${email}. Please check your inbox.`)
      } else {
        setStatus("error")
        setMessage(data.error || "Failed to resend verification email. Please try again.")
      }
    } catch (error) {
      console.error("Error resending verification email:", error)
      setStatus("error")
      setMessage("An unexpected error occurred. Please try again later.")
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Email Verification</CardTitle>
          <CardDescription className="text-center">
            {status === "loading" && "Verifying your email address..."}
            {status === "waiting" && "Please verify your email address"}
            {status === "success" && "Your email has been verified!"}
            {status === "error" && "Verification failed"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4 pt-4">
          {status === "loading" && (
            <div className="flex flex-col items-center space-y-4 py-6">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-center text-muted-foreground">Please wait while we verify your email...</p>
            </div>
          )}

          {status === "waiting" && (
            <div className="flex flex-col items-center space-y-4 py-6">
              <Mail className="h-16 w-16 text-primary" />
              <p className="text-center text-muted-foreground">{message}</p>
              <div className="text-center text-sm text-muted-foreground mt-4">
                <p>Didn't receive the email? Check your spam folder or</p>
                <Button variant="link" onClick={resendVerificationEmail} className="p-0 h-auto font-semibold">
                  click here to resend
                </Button>
              </div>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center space-y-4 py-6">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <p className="text-center text-green-600 dark:text-green-400">{message}</p>
              <p className="text-sm text-muted-foreground">Redirecting you to login page...</p>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center space-y-4 py-6">
              <XCircle className="h-16 w-16 text-red-500" />
              <p className="text-center text-red-600 dark:text-red-400">{message}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center pb-6">
          <Button onClick={() => router.push("/login")} disabled={status === "loading"} className="w-full max-w-xs">
            {status === "success" ? "Continue to Login" : "Go to Login"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

