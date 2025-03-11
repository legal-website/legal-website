import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the path is protected
  const isProtectedPath =
    pathname.startsWith("/dashboard") || pathname.startsWith("/admin") || pathname.startsWith("/profile")

  // Check if the path is auth-related
  const isAuthPath =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/verify-email")

  // Check if the path is an admin API route
  const isAdminApiRoute = pathname.startsWith("/api/admin")

  // Get the token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  console.log("Middleware checking path:", pathname, "Token:", token ? "exists" : "none")

  // If it's a protected path and there's no token, redirect to login
  if (isProtectedPath && !token) {
    console.log("No token found, redirecting to login")
    const url = new URL("/login", request.url)
    url.searchParams.set("callbackUrl", encodeURI(request.url))
    return NextResponse.redirect(url)
  }

  // If it's an auth path and there's a token, redirect to dashboard
  if (isAuthPath && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // If it's an admin path or admin API route and the user is not an admin
  if ((pathname.startsWith("/admin") || isAdminApiRoute) && token && token.role !== "ADMIN") {
    console.log("Access denied to admin path. User role:", token.role)
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // For debugging admin access
  if ((pathname.startsWith("/admin") || isAdminApiRoute) && token) {
    console.log("Admin access granted to:", pathname, "User role:", token.role)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/profile/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
    "/api/admin/:path*",
  ],
}

