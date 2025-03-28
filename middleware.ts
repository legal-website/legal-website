import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
// Fix: Import Role from our own types instead of @prisma/client
import { Role } from "./lib/prisma-types"
import { trackAffiliateClick } from "./lib/middleware/affiliate"

export async function middleware(request: NextRequest) {
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

    // Check if user has completed personal details verification
    // Skip this check for admin and support users
    if (token.role !== Role.ADMIN && token.role !== Role.SUPPORT) {
      try {
        // Make API call to check personal details status
        const response = await fetch(`${request.nextUrl.origin}/api/user/personal-details-status`, {
          headers: {
            Cookie: request.headers.get("cookie") || "",
          },
        })

        if (response.ok) {
          const data = await response.json()

          // If personal details don't exist or are pending/rejected, redirect to personal details page
          if (
            !data.personalDetails ||
            data.personalDetails.status !== "approved" ||
            !data.personalDetails.isRedirectDisabled
          ) {
            // Don't redirect if already on the personal details page
            if (!path.startsWith("/Personal-details")) {
              return NextResponse.redirect(new URL("/Personal-details", request.url))
            }
          }
        }
      } catch (error) {
        console.error("Error checking personal details status:", error)
        // Continue to dashboard if there's an error checking status
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/api/:path*",
    // Add matcher for affiliate tracking (all paths except certain ones)
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}

