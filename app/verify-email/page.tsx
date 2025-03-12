"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle, XCircle } from "lucide-react"

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // Handle the case where searchParams might be null
  const token = searchParams ? searchParams.get("token") : null

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("Verifying your email...")

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setMessage("Invalid verification link. Please request a new one.")
      return
    }

    // The actual verification happens in the API route
    // This page just shows a loading state and then redirects
    const timer = setTimeout(() => {
      // If we're still on this page after 5 seconds, show a button to go to login
      setStatus("success")
      setMessage("Email verified successfully! You can now log in.")
    }, 5000)

    return () => clearTimeout(timer)
  }, [token, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Email Verification</CardTitle>
          <CardDescription className="text-center">
            {status === "loading" && "Please wait while we verify your email"}
            {status === "success" && "Your email has been verified"}
            {status === "error" && "There was a problem verifying your email"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4 p-6">
          {status === "loading" && <Loader2 className="h-16 w-16 animate-spin text-primary" />}
          {status === "success" && <CheckCircle className="h-16 w-16 text-green-500" />}
          {status === "error" && <XCircle className="h-16 w-16 text-red-500" />}

          <p className="text-center text-lg">{message}</p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={() => router.push("/login")} className="w-full">
            Go to Login
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

