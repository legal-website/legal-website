import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
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

  // Check if the path is for verify-email page
  const isVerifyEmailPath = path.startsWith("/verify-email")

  // If user is logged in but email is not verified, redirect to verify-email page
  // Skip this check for API routes and the verify-email page itself
  if (token && !token.emailVerified && !path.startsWith("/api/") && !isVerifyEmailPath) {
    const url = new URL("/verify-email", request.url)
    url.searchParams.set("email", token.email as string)
    return NextResponse.redirect(url)
  }

  // If trying to access admin routes
  if (isAdminPath) {
    // Check if user is authenticated and is an admin or support
    if (!token || (token.role !== "ADMIN" && token.role !== "SUPPORT")) {
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

    // Skip personal details check for admin and support users
    if (token.role !== "ADMIN" && token.role !== "SUPPORT") {
      try {
        // Make API call to check personal details status
        const response = await fetch(`${request.nextUrl.origin}/api/user/personal-details-status`, {
          headers: {
            Cookie: request.headers.get("cookie") || "",
          },
        })

        if (response.ok) {
          const data = await response.json()

          // Check if personal details exist and are approved
          if (data.personalDetails && data.personalDetails.status === "approved") {
            // If redirect is NOT disabled (toggle is OFF), redirect to Personal-details
            if (!data.personalDetails.isRedirectDisabled) {
              // Don't redirect if already on the personal details page
              if (!path.startsWith("/Personal-details")) {
                return NextResponse.redirect(new URL("/Personal-details", request.url))
              }
            }
            // If redirect is disabled (toggle is ON), allow access to dashboard
          } else {
            // If personal details don't exist or are not approved, redirect
            if (!path.startsWith("/Personal-details")) {
              return NextResponse.redirect(new URL("/Personal-details", request.url))
            }
          }
        } else {
          // If API call fails, redirect to be safe
          if (!path.startsWith("/Personal-details")) {
            return NextResponse.redirect(new URL("/Personal-details", request.url))
          }
        }
      } catch (error) {
        console.error("Error checking personal details status:", error)
        // If there's an error, redirect to be safe
        if (!path.startsWith("/Personal-details")) {
          return NextResponse.redirect(new URL("/Personal-details", request.url))
        }
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

