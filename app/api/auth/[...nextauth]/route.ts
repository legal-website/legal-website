import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import type { NextAuthOptions } from "next-auth"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Find user in database
          const user = await db.user.findUnique({
            where: { email: credentials.email },
          })

          if (!user) {
            return null
          }

          // Simple direct comparison of passwords
          if (user.password !== credentials.password) {
            return null
          }

          // Check if the user's email is verified
          const isEmailVerified = await checkEmailVerification(user.id, user.email)

          // Return the user object
          return {
            id: user.id,
            email: user.email,
            name: user.name || "",
            role: user.role,
            image: user.image || null,
            isVerified: isEmailVerified, // Use a different property name
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.role = user.role
        token.picture = user.image
        token.isVerified = user.isVerified // Use the same property name
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.role = token.role as string
        session.user.image = token.picture as string | null
        // Add isVerified to the session user object
        session.user.isVerified = token.isVerified as boolean
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

// Helper function to check if the user's email is verified
async function checkEmailVerification(userId: string, email: string): Promise<boolean> {
  try {
    // Check if there's an active verification token for this user
    const verificationToken = await db.verificationToken.findFirst({
      where: {
        userId: userId,
        identifier: email,
        expires: {
          gt: new Date(), // Token hasn't expired
        },
      },
      orderBy: {
        expires: "desc", // Get the most recent token
      },
    })

    // If there's no token or the token is used (null), the email is verified
    return !verificationToken
  } catch (error) {
    console.error("Error checking email verification:", error)
    return false // Default to unverified if there's an error
  }
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

