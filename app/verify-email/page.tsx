"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const [email, setEmail] = useState("")

  // Get token from URL
  const token = searchParams?.get("token") || null

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setMessage("No verification token provided.")
      return
    }

    const verifyToken = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`)
        const data = await response.json()

        if (response.ok && data.success) {
          setStatus("success")
          setMessage("Your email has been verified successfully!")
          setEmail(data.email)
        } else {
          setStatus("error")
          setMessage(data.error || "Failed to verify email. The token may be invalid or expired.")
        }
      } catch (error) {
        console.error("Error verifying email:", error)
        setStatus("error")
        setMessage("An error occurred while verifying your email. Please try again.")
      }
    }

    verifyToken()
  }, [token, toast])

  const handleContinue = () => {
    if (status === "success") {
      router.push(`/login${email ? `?email=${encodeURIComponent(email)}` : ""}`)
    } else {
      router.push("/register")
    }
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Email Verification</CardTitle>
          <CardDescription>
            {status === "loading"
              ? "Verifying your email address..."
              : status === "success"
                ? "Your email has been verified"
                : "Email verification failed"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center text-center">
          {status === "loading" && <Loader2 className="h-16 w-16 text-blue-500 animate-spin mb-4" />}

          {status === "success" && <CheckCircle className="h-16 w-16 text-green-500 mb-4" />}

          {status === "error" && <AlertCircle className="h-16 w-16 text-red-500 mb-4" />}

          <p className="mb-4">{message}</p>

          <Button onClick={handleContinue} className="mt-4">
            {status === "success" ? "Continue to Login" : "Back to Registration"}
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-500">
            Need help?{" "}
            <a href="/contact" className="text-blue-600 hover:underline">
              Contact Support
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

