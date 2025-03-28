import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { db } from "@/lib/db"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin or support
    const user = await db.user.findFirst({
      where: { email: session.user.email },
      select: { role: true },
    })

    if (!user || (user.role !== "ADMIN" && user.role !== "SUPPORT")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = params
    const body = await req.json()
    const { isRedirectDisabled } = body

    // Get the current personal details
    const currentDetails = await db.personalDetails.findUnique({
      where: { id },
    })

    if (!currentDetails) {
      return NextResponse.json({ error: "Personal details not found" }, { status: 404 })
    }

    // Only allow toggling redirect for approved applications
    // Remove this check to allow toggling for all statuses
    // if (currentDetails.status !== "approved") {
    //   return NextResponse.json({
    //     error: "Can only toggle redirect for approved applications"
    //   }, { status: 400 })
    // }

    // Update personal details
    const personalDetails = await db.personalDetails.update({
      where: { id },
      data: {
        isRedirectDisabled,
        updatedAt: new Date(),
      },
    })

    // Add after updating personal details
    console.log(`Toggled redirect for user ${currentDetails.userId}. isRedirectDisabled: ${isRedirectDisabled}`)

    return NextResponse.json({ personalDetails })
  } catch (error) {
    console.error("Error toggling redirect:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

