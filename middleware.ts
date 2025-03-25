import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

// Define Role enum if it's not exported from Prisma
enum Role {
  USER = "USER",
  ADMIN = "ADMIN",
  SUPPORT = "SUPPORT",
  CLIENT = "CLIENT",
}

export async function middleware(request: NextRequest) {
  // Get the pathname
  const path = request.nextUrl.pathname

  // Log all API requests for debugging
  if (path.startsWith("/api/")) {
    console.log(`API Request: ${path}`)
  }

  // Check if the path is for admin routes
  const isAdminPath = path.startsWith("/admin")

  // Check if the path is for dashboard routes
  const isDashboardPath = path.startsWith("/dashboard")

  // Get the token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  // If trying to access admin routes
  if (isAdminPath) {
    // Check if user is authenticated and is an admin or support
    if (!token || (token.role !== Role.ADMIN && token.role !== Role.SUPPORT)) {
      const url = new URL("/login", request.url)
      url.searchParams.set("callbackUrl", encodeURI(request.url))
      return NextResponse.redirect(url)
    }
  }

  // If trying to access dashboard routes
  if (isDashboardPath) {
    // Check if user is authenticated (any role can access dashboard)
    if (!token) {
      const url = new URL("/login", request.url)
      url.searchParams.set("callbackUrl", encodeURI(request.url))
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/api/:path*"],
}

