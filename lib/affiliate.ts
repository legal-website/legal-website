// Generate a referral link with the given code
export function generateReferralLink(code: string): string {
  // Use window.location.origin if available, otherwise use a default URL
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://yourdomain.com"
  return `${baseUrl}/?ref=${code}`
}

// Format currency with $ sign and 2 decimal places
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Format date to readable format
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date)
}

// Calculate progress percentage for progress bar
export function calculateProgress(current: number, target: number): number {
  if (target <= 0) return 0
  const progress = (current / target) * 100
  return Math.min(progress, 100) // Cap at 100%
}

