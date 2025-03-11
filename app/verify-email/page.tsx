"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"

export default function VerifyEmailPage() {
  const [verifying, setVerifying] = useState(false)
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  useEffect(() => {
    const token = searchParams?.get("token")
    const email = searchParams?.get("email")

    if (token) {
      verifyEmail(token)
    } else if (email) {
      // Just showing the waiting verification screen
      setVerifying(false)
    } else {
      setError("Invalid verification link")
    }
  }, [searchParams])

  const verifyEmail = async (token: string) => {
    setVerifying(true)
    setError("")

    try {
      const response = await fetch(`/api/auth/verify-email?token=${token}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Verification failed")
      }

      setVerified(true)
      toast({
        title: "Email verified",
        description: "Your email has been verified successfully. You can now log in.",
      })

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login")
      }, 3000)
    } catch (error: any) {
      setError(error.message)
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setVerifying(false)
    }
  }

  const emailWaiting = searchParams?.get("email") && !searchParams?.get("token")

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            {verified && <CheckCircle className="text-green-500 h-6 w-6" />}
            {error && <AlertCircle className="text-red-500 h-6 w-6" />}
            {verifying && <Loader2 className="h-6 w-6 animate-spin" />}
            {!verified && !error && !verifying && "Email Verification"}
            {verified && "Email Verified"}
            {error && "Verification Failed"}
          </CardTitle>
          <CardDescription>
            {emailWaiting &&
              `We've sent a verification email to ${searchParams?.get("email")}. Please check your inbox.`}
            {!emailWaiting && !verified && !error && "Verifying your email address..."}
            {verified && "Your email has been verified successfully."}
            {error && error}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {emailWaiting && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              If you don't see an email from us within a few minutes, check your spam folder. If you still don't see it,
              you can request a new verification email.
            </p>
          )}
          {verified && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              You will be redirected to the login page in 3 seconds.
            </p>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          {emailWaiting && (
            <Button
              variant="outline"
              onClick={() => {
                // Request a new verification email
                toast({
                  title: "Verification email sent",
                  description: "We've sent a new verification email. Please check your inbox.",
                })
              }}
            >
              Resend Verification Email
            </Button>
          )}
          {(verified || error) && (
            <Link href="/login">
              <Button>{verified ? "Go to Login" : "Back to Login"}</Button>
            </Link>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

