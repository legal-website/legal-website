import type { ReactNode } from "react"
import DashboardSidebar from "@/components/dashboard/sidebar"
import { CartProvider } from "@/context/cart-context"
import { Toaster } from "@/components/ui/toaster"
import LiveSupportWidget from "@/components/live-support-widget"
import { ThemeProvider } from "@/context/theme-context"
import { OnlineStatusTracker } from "@/components/online-status-tracker"
import DashboardAccessCheck from "./dashboard-access-check"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <CartProvider>
        <DashboardAccessCheck>
          <div className="min-h-screen theme-transition">
            <Toaster />
            <OnlineStatusTracker />
            <div className="flex h-screen overflow-hidden">
              <DashboardSidebar />
              <main className="flex-1 overflow-y-auto p-0">{children}</main>
            </div>
            <LiveSupportWidget />
          </div>
        </DashboardAccessCheck>
      </CartProvider>
    </ThemeProvider>
  )
}

