// This is a utility to help find where the error message is coming from
export function findErrorSource() {
    // Override the console.error method to log the stack trace
    const originalConsoleError = console.error
  
    console.error = (...args) => {
      // Call the original method
      originalConsoleError.apply(console, args)
  
      // Check if the error message contains our target
      const errorMessage = args.join(" ")
      if (errorMessage.includes("no invoice return from the server")) {
        console.log("Error source stack trace:")
        console.trace()
      }
    }
  
    // Also override window.onerror to catch unhandled errors
    if (typeof window !== "undefined") {
      window.onerror = (message, source, lineno, colno, error) => {
        if (message && message.toString().includes("no invoice return from the server")) {
          console.log("Unhandled error source:")
          console.log("Message:", message)
          console.log("Source:", source)
          console.log("Line:", lineno)
          console.log("Column:", colno)
          console.log("Error object:", error)
        }
        return false // Let the default handler run
      }
    }
  }
  
  