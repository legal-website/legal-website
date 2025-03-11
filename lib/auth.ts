import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions as nextAuthOptions } from "@/app/api/auth/[...nextauth]/route"

// Export the authOptions for use in other files
export const authOptions = nextAuthOptions

// Check if user is authenticated (for server components)
export async function requireAuth() {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    redirect("/login")
  }

  return session
}

// Check if user is an admin (for server components)
export async function requireAdmin() {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    redirect("/login?callbackUrl=/admin")
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard")
  }

  return session
}

// Check if user is a super admin (for server components)
export async function requireSuperAdmin() {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    redirect("/login?callbackUrl=/admin")
  }

  if (session.user.role !== "SUPER_ADMIN") {
    redirect("/admin")
  }

  return session
}

// Get user role from session
export function getUserRole(session: any) {
  return session?.user?.role || null
}

// Check if user has a specific role
export function hasRole(session: any, role: string) {
  return session?.user?.role === role
}

// Check if user is a super admin
export function isSuperAdmin(session: any) {
  return session?.user?.role === "SUPER_ADMIN"
}

