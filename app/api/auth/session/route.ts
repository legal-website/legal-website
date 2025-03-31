import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // Check if this is a request to update the session
    const searchParams = request.nextUrl.searchParams
    const update = searchParams.get("update")

    // Get the current session
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No active session" }, { status: 401 })
    }

    // If this is an update request, we'll force a session refresh
    // This is a no-op in the API but will cause the client to refresh the session
    if (update === "true") {
      console.log("Session update requested")
    }

    return NextResponse.json({
      session: {
        user: {
          name: session.user?.name,
          email: session.user?.email,
          image: session.user?.image,
        },
        expires: session.expires,
      },
    })
  } catch (error) {
    console.error("Error in session API:", error)
    return NextResponse.json({ error: "Failed to get session" }, { status: 500 })
  }
}


