"use server"

import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions as nextAuthOptions } from "@/app/api/auth/[...nextauth]/route"
import * as bcryptjs from "bcryptjs"

// Export the authOptions for use in other files
export const authOptions = nextAuthOptions

// Export the auth function
export async function auth() { return getServerSession(authOptions) }

// Hash password function for user creation/authentication
export async function hashPassword(password: string): Promise<string> {
 const saltRounds = 10
 return bcryptjs.hash(password, saltRounds)
}

// Compare password with hash
export async function verifyPassword(hashedPassword: string, plainPassword: string): Promise<boolean> {
 return bcryptjs.compare(plainPassword, hashedPassword)
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

 if (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT") {
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

 if (session.user.role !== "ADMIN") {
   redirect("/admin")
 }

 return session
}

// Get user role from session
export async function getUserRole(session: any) {
 return session?.user?.role || null
}

// Check if user has a specific role
export async function hasRole(session: any, role: string) {
 return session?.user?.role === role
}

// Check if user is a super admin
export async function isSuperAdmin(session: any) {
 return session?.user?.role === "ADMIN"
}