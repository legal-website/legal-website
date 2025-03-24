// Helper functions for affiliate program

export function generateReferralLink(code: string): string {
  return `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}?ref=${code}`
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function calculateProgress(current: number, target: number): number {
  if (target <= 0) return 0
  const progress = (current / target) * 100
  return Math.min(progress, 100)
}

