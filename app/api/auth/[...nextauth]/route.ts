import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import type { NextAuthOptions } from "next-auth"
// Import the verifyPassword function at the top of the file
import { verifyPassword } from "@/lib/auth-service"

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
          console.log("Missing credentials");
          return null;
        }

        try {
          // Find user in database using Prisma client directly
          const user = await db.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user) {
            console.log(`User not found: ${credentials.email}`);
            return null;
          }

          console.log(`User found: ${user.email}, checking password...`);
          
          // Check if the password is in the expected format (contains a dot for hash.salt)
          if (!user.password.includes('.')) {
            console.log("Password is not in the expected hash.salt format");
            
            // Fallback to direct comparison for legacy passwords
            if (user.password === credentials.password) {
              console.log("Direct password match successful (legacy format)");
              return {
                id: user.id,
                email: user.email,
                name: user.name || "",
                role: user.role,
              };
            } else {
              console.log("Direct password match failed (legacy format)");
              return null;
            }
          }
          
          // For properly hashed passwords, use verifyPassword
          try {
            const isPasswordValid = await verifyPassword(user.password, credentials.password);
            console.log(`Password verification result: ${isPasswordValid}`);
            
            if (!isPasswordValid) {
              return null;
            }
          } catch (verifyError) {
            console.error("Password verification error:", verifyError);
            
            // Fallback to direct comparison if verification throws an error
            if (user.password === credentials.password) {
              console.log("Direct password match successful (after verification error)");
              return {
                id: user.id,
                email: user.email,
                name: user.name || "",
                role: user.role,
              };
            } else {
              console.log("Direct password match failed (after verification error)");
              return null;
            }
          }

          // Return the user without checking role
          // This allows any role (ADMIN, SUPPORT, CLIENT) to log in
          return {
            id: user.id,
            email: user.email,
            name: user.name || "",
            role: user.role,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
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