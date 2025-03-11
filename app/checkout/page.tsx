"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { ErrorBoundary } from "@/components/error-boundary"

function PaymentPageContent() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checkoutData, setCheckoutData] = useState<any>(null)

  useEffect(() => {
    // Simple check to see if we can access the window object
    try {
      if (typeof window !== "undefined") {
        // Try to get checkout data from session storage
        const storedData = sessionStorage.getItem("checkoutData")
        if (storedData) {
          setCheckoutData(JSON.parse(storedData))
        }
        setLoading(false)
      }
    } catch (err) {
      console.error("Initialization error:", err)
      setError("Failed to initialize page")
      setLoading(false)
    }
  }, [])

  const handleGoBack = () => {
    try {
      router.push("/checkout")
    } catch (err) {
      console.error("Navigation error:", err)
      setError("Failed to navigate back")

      toast({
        title: "Navigation Error",
        description: "Could not go back to the checkout page. Please use your browser's back button.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading payment page...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-xl font-bold mb-4">Error</h1>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
          <Button onClick={() => window.history.back()} className="w-full">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <Button variant="ghost" className="mb-8" onClick={handleGoBack}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Checkout
      </Button>

      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Payment</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Our payment system is currently being updated. Please check back later or contact our support team for
            assistance.
          </p>
          <Button onClick={handleGoBack} className="w-full">
            Return to Checkout
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <ErrorBoundary>
      <PaymentPageContent />
    </ErrorBoundary>
  )
}

