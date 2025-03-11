import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { Toaster } from "@/components/ui/toaster"
import AdminSidebar from "@/components/admin/sidebar"
import AdminHeader from "@/components/admin/header"
import { ThemeProvider } from "@/context/theme-context"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  try {
    // Get the session
    const session = await getServerSession(authOptions)

    // Check if user is authenticated
    if (!session || !session.user) {
      console.log("No session found in admin layout - redirecting to login")
      redirect("/login?callbackUrl=/admin")
    }

    // Check if user has admin role
    if ((session.user as any).role !== "ADMIN") {
      console.log("User does not have admin role:", (session.user as any).role)
      redirect("/dashboard")
    }

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
  } catch (error) {
    console.error("Error in admin layout:", error)
    redirect("/login?callbackUrl=/admin")
  }
}

