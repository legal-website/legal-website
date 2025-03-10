"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

export default function ThankYouPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const verified = searchParams.get("verified") === "true"

  useEffect(() => {
    // Clear cart if it exists in localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("cart")
    }
  }, [])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-[#22c984]" />
          </div>
          <CardTitle className="text-center text-2xl">Thank You!</CardTitle>
          <CardDescription className="text-center">
            {verified
              ? "Your email has been verified and your account is now active."
              : "Your registration is complete. Please check your email to verify your account."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-600 mb-6">
            {verified
              ? "You can now access your dashboard and manage your services."
              : "We've sent a verification link to your email address. Please click the link to activate your account."}
          </p>

          <div className="flex justify-center">
            <Button
              onClick={() => router.push(verified ? "/dashboard" : "/")}
              className="bg-[#22c984] hover:bg-[#1eac73] text-white"
            >
              {verified ? "Go to Dashboard" : "Return to Home"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

