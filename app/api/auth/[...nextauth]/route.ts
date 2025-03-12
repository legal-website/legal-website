import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaClient, Role } from "@prisma/client"
import type { NextAuthOptions } from "next-auth"
import * as bcryptjs from "bcryptjs"

const prisma = new PrismaClient()

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
          console.log("NextAuth: Missing credentials")
          return null
        }

        try {
          // Find user in database
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          })

          if (!user || !user.password) {
            console.log("NextAuth: User not found or no password")
            return null
          }

          console.log("NextAuth: User found:", user.id)
          console.log("NextAuth: User password format:", user.password.substring(0, 10) + "...")

          // Check if email is verified, but allow login in development environment
          if (!user.emailVerified && process.env.NODE_ENV === "production") {
            console.log("NextAuth: Email not verified")
            throw new Error("Email not verified")
          }

          // Check if password matches using bcryptjs directly
          console.log("NextAuth: Verifying password for:", credentials.email)
          let passwordMatch = false
          try {
            passwordMatch = await bcryptjs.compare(credentials.password, user.password)
            console.log("NextAuth: Password match result:", passwordMatch)
          } catch (error) {
            console.error("NextAuth: Password verification error:", error)
          }

          if (!passwordMatch) {
            console.log("NextAuth: Password doesn't match")
            return null
          }

          console.log("NextAuth: Password verified successfully")

          // Check if user has admin privileges
          if (user.role !== Role.ADMIN && user.role !== Role.SUPPORT) {
            console.log("NextAuth: User doesn't have admin role")
            return null
          }

          console.log("NextAuth: User authorized successfully")
          return {
            id: user.id,
            email: user.email,
            name: user.name || "",
            role: user.role,
          }
        } catch (error) {
          console.error("NextAuth: Auth error:", error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
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
  },
  debug: true, // Enable debug mode to see more detailed logs
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

