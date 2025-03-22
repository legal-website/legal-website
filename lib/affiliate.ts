// Helper functions for affiliate program

export function generateReferralLink(code: string): string {
    return `https://legal-website-five.vercel.app/?ref=${code}`
  }
  
  export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }
  
  export function formatDate(date: Date | string): string {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(date))
  }
  
  export function calculateProgress(current: number, target: number): number {
    if (current >= target) return 100
    return Math.floor((current / target) * 100)
  }
  
  