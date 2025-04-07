export function getAppUrl(): string {
  // First try to get the NEXT_PUBLIC_APP_URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  if (appUrl) {
    return appUrl
  }

  // Fallback to the Vercel deployment URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // Final fallback
  return "https://orizeninc.com"
}

