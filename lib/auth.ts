import { hash, compare } from "bcryptjs"
import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"

// Import the authOptions directly from the NextAuth route file
// We'll export it from there and import it here to avoid circular dependencies
import { authOptions as nextAuthOptions } from "@/app/api/auth/[...nextauth]/route"

// Export the authOptions for use in other files
export const authOptions = nextAuthOptions

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  return await hash(password, 12)
}

// Password verification
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await compare(password, hashedPassword)
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

  if ((session.user as any).role !== "ADMIN") {
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

