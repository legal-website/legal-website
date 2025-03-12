import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions as nextAuthOptions } from "@/app/api/auth/[...nextauth]/route"
import * as bcryptjs from "bcryptjs"
import { Role } from "@prisma/client"

// Export the authOptions for use in other files
export const authOptions = nextAuthOptions

// Hash password function for user creation/authentication
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10
  return bcryptjs.hash(password, saltRounds)
}

// Compare password with hash
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcryptjs.compare(password, hashedPassword)
}

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

  if (session.user.role !== Role.ADMIN && session.user.role !== Role.SUPPORT) {
    redirect("/dashboard")
  }

  return session
}

// Check if user is a support staff (for server components)
export async function requireSupport() {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    redirect("/login?callbackUrl=/admin")
  }

  if (session.user.role !== Role.SUPPORT && session.user.role !== Role.ADMIN) {
    redirect("/dashboard")
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

// Check if user is an admin
export function isAdmin(session: any) {
  return session?.user?.role === Role.ADMIN
}

// Check if user is support staff
export function isSupport(session: any) {
  return session?.user?.role === Role.SUPPORT
}

// Check if user is a client
export function isClient(session: any) {
  return session?.user?.role === Role.CLIENT
}

