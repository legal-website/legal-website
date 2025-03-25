import type { ReactNode } from "react"
import DashboardSidebar from "@/components/dashboard/sidebar"
import { CartProvider } from "@/context/cart-context"
import { Toaster } from "@/components/ui/toaster"
import LiveSupportWidget from "@/components/live-support-widget"
import { ThemeProvider } from "@/context/theme-context"
import { OnlineStatusTracker } from "@/components/online-status-tracker"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// Helper function to get business data
async function getBusinessByUserId(userId: string) {
  if (!userId) return null

  try {
    const business = await db.business.findFirst({
      where: { userId },
    })
    return business
  } catch (error) {
    console.error("Error fetching business data:", error)
    return null
  }
}

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // Get user session and business data
  const session = await getServerSession(authOptions)
  const business = session?.user?.id ? await getBusinessByUserId(session.user.id) : null

  return (
    <ThemeProvider>
      <CartProvider>
        <div className="min-h-screen theme-transition">
          <Toaster />
          <OnlineStatusTracker />
          <div className="flex h-screen overflow-hidden">
            <DashboardSidebar
              userData={{
                id: session?.user?.id || "",
                name: session?.user?.name || null,
                image: session?.user?.image || null,
                businessName: business?.name || null,
              }}
            />
            <main className="flex-1 overflow-y-auto p-0">{children}</main>
          </div>
          <LiveSupportWidget />
        </div>
      </CartProvider>
    </ThemeProvider>
  )
}

