interface Customer {
    name: string
    email: string
    phone?: string
    company?: string
    address?: string
    city?: string
    state?: string
    zip?: string
    country?: string
  }
  
  interface CheckoutItem {
    id?: string
    tier: string
    price: number
    stateFee?: number
    state?: string
    discount?: number
  }
  
  interface CheckoutData {
    customer: Customer
    items: CheckoutItem[]
    total: number
  }
  
  interface CheckoutResponse {
    success: boolean
    invoice?: {
      id: string
      invoiceNumber: string
      [key: string]: any
    }
    error?: string
    message?: string
  }
  
  export async function processCheckout(data: CheckoutData): Promise<CheckoutResponse> {
    try {
      console.log("Processing checkout with data:", data)
  
      // Send the data to the API
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
  
      // Log the raw response for debugging
      console.log("Checkout response status:", response.status)
  
      // Get the response text
      const responseText = await response.text()
      console.log("Raw response:", responseText)
  
      // Try to parse the response as JSON
      let responseData: CheckoutResponse
      try {
        responseData = JSON.parse(responseText)
      } catch (parseError) {
        console.error("Failed to parse response as JSON:", parseError)
        return {
          success: false,
          error: "Invalid response from server",
          message: responseText,
        }
      }
  
      // Check if the response was successful
      if (!response.ok) {
        return {
          success: false,
          error: responseData.message || responseData.error || "Failed to process checkout",
          message: responseText,
        }
      }
  
      // Return the parsed response
      return {
        success: true,
        invoice: responseData.invoice,
        message: responseData.message,
      }
    } catch (error: any) {
      console.error("Checkout processing error:", error)
      return {
        success: false,
        error: error.message || "An unexpected error occurred",
      }
    }
  }
  
  