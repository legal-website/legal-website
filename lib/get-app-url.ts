/**
 * Gets the application URL from environment variables or falls back to a default
 * This helps prevent "undefined" in URLs
 */
export function getAppUrl(): string {
    // First try to get the URL from environment variables
    const envUrl = process.env.NEXT_PUBLIC_APP_URL
  
    // If we have a valid URL, return it
    if (envUrl && envUrl.startsWith("http")) {
      return envUrl.trim()
    }
  
    // In development, fall back to localhost
    if (process.env.NODE_ENV === "development") {
      return "http://localhost:3000"
    }
  
    // In production, try to determine the URL from the request
    // This is a fallback and not ideal, but better than "undefined"
    if (typeof window !== "undefined") {
      return window.location.origin
    }
  
    // Last resort fallback - use your actual domain
    return "https://legal-website-five.vercel.app"
  }
  
  