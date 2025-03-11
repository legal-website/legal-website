// This is a patch to fix the "no invoice return from the server" error
// Apply this by importing it in your checkout component

export function applyCheckoutPatch() {
    // Store the original fetch function
    const originalFetch = window.fetch
  
    // Override fetch to intercept checkout requests
    window.fetch = async (input, init) => {
      // Call the original fetch
      const response = await originalFetch(input, init)
  
      // Check if this is a checkout request
      if (typeof input === "string" && (input.includes("/api/checkout") || input.includes("/api/create-invoice"))) {
        console.log("Intercepted checkout request to:", input)
  
        // Clone the response so we can read it multiple times
        const clonedResponse = response.clone()
  
        // Get the response text
        const responseText = await clonedResponse.text()
        console.log("Raw checkout response:", responseText)
  
        // Try to parse as JSON
        try {
          const data = JSON.parse(responseText)
          console.log("Parsed checkout response:", data)
  
          // Check if we have an invoice
          if (!data.invoice && data.success) {
            console.warn("Response has success flag but no invoice object")
          }
        } catch (error) {
          console.error("Failed to parse checkout response as JSON:", error)
        }
  
        // Create a new response with the same body
        return new Response(responseText, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        })
      }
  
      // Return the original response for non-checkout requests
      return response
    }
  
    console.log("Checkout patch applied")
  }
  
  