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

// Update the getBusinessByUserId function to handle errors better
async function getBusinessByUserId(userId: string) {
  if (!userId) return null

  try {
    console.log(`Fetching business data for user: ${userId}`)
    // First, get the user to find their businessId
    const user = await db.user.findUnique({
      where: { id: userId },
    })

    if (!user?.businessId) return null

    // Then fetch the business using the businessId
    const business = await db.business.findUnique({
      where: { id: user.businessId },
    })

    return business
  } catch (error) {
    console.error("Error fetching business data:", error)
    return null
  }
}

// Update the layout function to handle errors
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // Get user session and business data
  let userData: {
    id: string
    name: string | null
    image: string | null
    businessName: string | null
  } = {
    id: "",
    name: null,
    image: null,
    businessName: null,
  }

  try {
    const session = await getServerSession(authOptions)

    if (session?.user) {
      const userId = (session.user as any).id
      const business = userId ? await getBusinessByUserId(userId) : null

      userData = {
        id: userId || "",
        name: session.user.name || null,
        image: session.user.image || null,
        businessName: business?.name || null,
      }
    }
  } catch (error) {
    console.error("Error in dashboard layout:", error)
    // Continue with default userData
  }

  return (
    <ThemeProvider>
      <CartProvider>
        <div className="min-h-screen theme-transition">
          <Toaster />
          <OnlineStatusTracker />
          <div className="flex h-screen overflow-hidden">
            <DashboardSidebar userData={userData} />
            <main className="flex-1 overflow-y-auto p-0">{children}</main>
          </div>
          <LiveSupportWidget />
        </div>
      </CartProvider>
    </ThemeProvider>
  )
}

