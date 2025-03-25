import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
import { trackAffiliateClick } from "./lib/middleware/affiliate"
import { trackLoginMiddleware } from "./lib/middleware/track-login"

// Define Role enum if it's not exported from Prisma
enum Role {
  USER = "USER",
  ADMIN = "ADMIN",
  SUPPORT = "SUPPORT",
}

export async function middleware(request: NextRequest) {
  // Track login sessions for authentication routes
  if (
    request.nextUrl.pathname === "/api/auth/callback/google" ||
    request.nextUrl.pathname === "/api/auth/callback/credentials" ||
    request.nextUrl.pathname === "/api/auth/session"
  ) {
    return await trackLoginMiddleware(request)
  }

  // Track affiliate clicks if ref parameter is present
  if (request.nextUrl.searchParams.has("ref")) {
    return await trackAffiliateClick(request)
  }

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
  matcher: [
    "/api/auth/callback/google",
    "/api/auth/callback/credentials",
    "/api/auth/session",
    "/admin/:path*",
    "/dashboard/:path*",
    "/api/:path*",
    // Add matcher for affiliate tracking (all paths except certain ones)
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}

