import type { ReactNode } from "react"
import DashboardSidebar from "@/components/dashboard/sidebar"
import { CartProvider } from "@/context/cart-context"
import { Toaster } from "@/components/ui/toaster"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <div className="min-h-screen bg-gray-100">
        <Toaster />
        <div className="flex h-screen overflow-hidden">
          <DashboardSidebar />
          <main className="flex-1 overflow-y-auto p-0">{children}</main>
        </div>
      </div>
    </CartProvider>
  )
}

