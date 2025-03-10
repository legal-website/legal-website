import { type NextRequest, NextResponse } from "next/server"
import { validateSession } from "./lib/auth-service"

export async function middleware(request: NextRequest) {
  // Paths that don't require authentication
  const publicPaths = ["/", "/login", "/register", "/api/auth/login", "/api/auth/register"]

  // Check if the path is public
  const isPublicPath = publicPaths.some(
    (path) => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith("/api/auth/"),
  )

  if (isPublicPath) {
    return NextResponse.next()
  }

  // Get the session token from cookies
  const sessionToken = request.cookies.get("session_token")?.value

  if (!sessionToken) {
    // Redirect to login if no session token
    return NextResponse.redirect(new URL("/login", request.url))
  }

  try {
    // Validate the session
    const user = await validateSession(sessionToken)

    if (!user) {
      // Redirect to login if session is invalid
      return NextResponse.redirect(new URL("/login", request.url))
    }

    // Check role-based access for admin routes
    if (request.nextUrl.pathname.startsWith("/admin") && user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    // Check role-based access for support routes
    if (request.nextUrl.pathname.startsWith("/support") && user.role !== "ADMIN" && user.role !== "SUPPORT") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    return NextResponse.next()
  } catch (error) {
    // Redirect to login if there's an error
    return NextResponse.redirect(new URL("/login", request.url))
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
}

