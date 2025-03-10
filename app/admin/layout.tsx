import type { ReactNode } from "react"
import { Toaster } from "@/components/ui/toaster"
import AdminSidebar from "@/components/admin/sidebar"
import AdminHeader from "@/components/admin/header"
import { ThemeProvider } from "@/context/theme-context"

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 theme-transition">
        <Toaster />
        <div className="flex h-screen overflow-hidden">
          <AdminSidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <AdminHeader />
            <main className="flex-1 overflow-y-auto p-0">{children}</main>
          </div>
        </div>
      </div>
    </ThemeProvider>
  )
}

