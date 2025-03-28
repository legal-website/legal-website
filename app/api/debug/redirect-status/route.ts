import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find the user
    const user = await db.user.findFirst({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Find personal details for the user - fixed the Prisma query structure
    const personalDetails = await db.personalDetails.findFirst({
      where: { userId: user.id },
    })

    // Return detailed debug information
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      personalDetails: personalDetails
        ? {
            id: personalDetails.id,
            status: personalDetails.status,
            isRedirectDisabled: personalDetails.isRedirectDisabled,
            createdAt: personalDetails.createdAt,
            updatedAt: personalDetails.updatedAt,
          }
        : null,
      dashboardAccess:
        personalDetails && personalDetails.status === "approved" && personalDetails.isRedirectDisabled === true,
      redirectionStatus: {
        shouldRedirect:
          !personalDetails || personalDetails.status !== "approved" || !personalDetails.isRedirectDisabled,
        reason: !personalDetails
          ? "No personal details found"
          : personalDetails.status !== "approved"
            ? "Personal details not approved"
            : !personalDetails.isRedirectDisabled
              ? "Dashboard access not enabled"
              : "No redirection needed",
      },
    })
  } catch (error) {
    console.error("Error checking redirect status:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

