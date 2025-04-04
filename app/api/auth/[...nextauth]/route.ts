import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import type { NextAuthOptions } from "next-auth"
import { verifyPassword, hashPassword } from "@/lib/auth-service"

export const authOptions: NextAuthOptions = {
  debug: true, // Enable debug mode to see more detailed logs
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("[NextAuth] Missing credentials")
          return null
        }

        try {
          console.log(`[NextAuth] Attempting login for email: ${credentials.email}`)

          // Find user in database using Prisma client directly
          const user = await db.user.findUnique({
            where: { email: credentials.email },
          })

          if (!user) {
            console.log(`[NextAuth] User not found: ${credentials.email}`)
            return null
          }

          console.log(`[NextAuth] User found: ${user.email}, checking password...`)

          let isAuthenticated = false
          let shouldUpdatePassword = false

          // FIRST: Try direct comparison (for plaintext passwords in database)
          if (user.password === credentials.password) {
            console.log("[NextAuth] Direct password match successful")
            isAuthenticated = true
            shouldUpdatePassword = true // Flag to update to proper hash format
          }
          // SECOND: Try hash verification (for properly hashed passwords)
          else if (user.password.includes(".")) {
            try {
              const isValid = await verifyPassword(user.password, credentials.password)
              console.log(`[NextAuth] Hash verification result: ${isValid}`)
              if (isValid) {
                isAuthenticated = true
              }
            } catch (verifyError) {
              console.error("[NextAuth] Password verification error:", verifyError)
            }
          }

          if (!isAuthenticated) {
            console.log("[NextAuth] Authentication failed - invalid credentials")
            return null
          }

          // If authenticated with plaintext password, update to proper hash format
          if (shouldUpdatePassword) {
            try {
              const hashedPassword = await hashPassword(credentials.password)
              await db.user.update({
                where: { id: user.id },
                data: { password: hashedPassword },
              })
              console.log("[NextAuth] Updated user password to secure hash format")
            } catch (updateError) {
              console.error("[NextAuth] Failed to update password:", updateError)
              // Continue with login even if update fails
            }
          }

          // Authentication successful
          console.log("[NextAuth] Authentication successful")

          // Return a simplified user object with only the properties NextAuth expects
          return {
            id: user.id,
            email: user.email,
            name: user.name || "",
            role: user.role,
            image: user.image || null,
          }
        } catch (error) {
          console.error("[NextAuth] Auth error:", error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // When user logs in, add their data to the token
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.role = user.role
        token.picture = user.image
      }
      return token
    },
    async session({ session, token }) {
      // Add user data from token to the session
      if (session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.role = token.role as string
        session.user.image = token.picture as string | null
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || "your-fallback-secret-should-be-changed",
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

