import { NextResponse, type NextRequest } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET(req: NextRequest) {
  try {
    // Get the session
    const session = await getServerSession(authOptions)

    // Debug session information
    console.log("Admin API route accessed, session:", !!session)

    // Check if user is authenticated
    if (!session || !session.user) {
      console.log("No session found - user is not authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has admin role
    if ((session.user as any).role !== "ADMIN") {
      console.log("User does not have admin role:", (session.user as any).role)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      message: "Admin API is working",
      stats: {
        users: 2543,
        documents: 8942,
        revenue: 42389,
        tasks: 47,
      },
    })
  } catch (error) {
    console.error("Error in admin API route:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

