"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Mail, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // Add null checks when accessing searchParams
  const token = searchParams ? searchParams.get("token") : null
  const email = searchParams ? searchParams.get("email") : null
  const { toast } = useToast()

  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (token) {
      verifyEmail(token)
    }
  }, [token])

  const verifyEmail = async (token: string) => {
    setStatus("verifying")

    try {
      const response = await fetch(`/api/auth/verify-email?token=${token}`)
      const data = await response.json()

      if (response.ok) {
        setStatus("success")
        setMessage("Your email has been verified successfully!")

        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/login?verified=true")
        }, 3000)
      } else {
        setStatus("error")
        setMessage(data.error || "Verification failed. Please try again.")
      }
    } catch (error) {
      setStatus("error")
      setMessage("Something went wrong. Please try again.")
    }
  }

  const resendVerification = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please provide your email address to resend verification.",
        variant: "destructive",
      })
      return
    }

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
        toast({
          title: "Verification email sent",
          description: "Please check your inbox for the verification link.",
        })
      } else {
        toast({
          title: "Failed to resend",
          description: data.error || "Something went wrong. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4">
            {status === "success" ? (
              <CheckCircle className="h-16 w-16 text-[#22c984]" />
            ) : status === "error" ? (
              <AlertCircle className="h-16 w-16 text-red-500" />
            ) : (
              <Mail className="h-16 w-16 text-blue-500" />
            )}
          </div>
          <CardTitle className="text-center text-2xl">
            {status === "success"
              ? "Email Verified!"
              : status === "error"
                ? "Verification Failed"
                : "Verify Your Email"}
          </CardTitle>
          <CardDescription className="text-center">
            {status === "success"
              ? "Your email has been verified successfully."
              : status === "error"
                ? message
                : email
                  ? `We've sent a verification link to ${email}`
                  : "Please check your email for a verification link."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === "success" ? (
            <p className="text-center text-gray-500">You will be redirected to the login page shortly.</p>
          ) : status === "error" ? (
            <div className="flex justify-center">
              <Button onClick={() => router.push("/login")} className="bg-[#22c984] hover:bg-[#1eac73] text-white">
                Go to Login
              </Button>
            </div>
          ) : (
            <p className="text-center text-gray-500">
              Please check your inbox and click on the verification link to complete your registration. If you don't see
              the email, check your spam folder.
            </p>
          )}
        </CardContent>
        {(status === "idle" || status === "error") && email && (
          <CardFooter className="flex justify-center">
            <Button variant="outline" onClick={resendVerification}>
              Resend Verification Email
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}

