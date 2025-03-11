import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import AdminSidebar from "@/components/admin/sidebar"
import AdminHeader from "@/components/admin/header"
import { ThemeProvider } from "@/context/theme-context"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  try {
    // Get the session
    const session = await getServerSession(authOptions)

    // Check if user is authenticated
    if (!session?.user) {
      redirect("/login?callbackUrl=/admin")
    }

    // Check if user has admin role
    const userRole = (session.user as any).role
    if (userRole !== "ADMIN") {
      redirect("/dashboard")
    }

    return (
      <ThemeProvider>
        <div className="flex h-screen overflow-hidden">
          <AdminSidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <AdminHeader />
            <div className="flex-1 overflow-y-auto">{children}</div>
          </div>
        </div>
      </ThemeProvider>
    )
  } catch (error) {
    console.error("Error in admin layout:", error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4">Error Loading Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            There was a problem loading the admin dashboard. Please try logging in again.
          </p>
          <a
            href="/login?callbackUrl=/admin"
            className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Back to Login
          </a>
        </div>
      </div>
    )
  }
}

