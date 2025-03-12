import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaClient, Role } from "@prisma/client"
import type { NextAuthOptions } from "next-auth"
import { verifyPassword } from "@/lib/auth-service"

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
          return null
        }

        try {
          // Find user in database
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          })

          if (!user) {
            return null
          }

          // Check if email is verified, but allow login in development environment
          if (!user.emailVerified && process.env.NODE_ENV === "production") {
            throw new Error("Email not verified")
          }

          // Check if password matches using the verifyPassword function
          const isPasswordValid = await verifyPassword(user.password, credentials.password)
          if (!isPasswordValid) {
            return null
          }

          // Check if user has admin role
          if (user.role !== Role.ADMIN && user.role !== Role.SUPPORT) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name || "",
            role: user.role,
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
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

