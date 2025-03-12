import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import AdminSidebar from "@/components/admin/sidebar"
import AdminHeader from "@/components/admin/header"
import { ThemeProvider } from "@/context/theme-context"
import { Role } from "@prisma/client"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  try {
    // Get the session
    const session = await getServerSession(authOptions)

    // Check if user is authenticated
    if (!session?.user) {
      redirect("/login?callbackUrl=/admin")
    }

    // Check if user has admin role
    const userRole = session.user.role
    if (userRole !== Role.ADMIN) {
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
    redirect("/login?callbackUrl=/admin")
  }
}

