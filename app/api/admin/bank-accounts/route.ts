import { type NextRequest, NextResponse } from "next/server"
import { validateSession } from "@/lib/session-utils"
import { db } from "@/lib/db"

// GET handler to fetch all bank accounts (admin only)
export async function GET(req: NextRequest) {
  try {
    const { isValid, response, userId } = await validateSession()

    if (!isValid || !userId) {
      return response || NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ message: "Only administrators can access bank accounts" }, { status: 403 })
    }

    // Fetch all bank accounts
    const bankAccounts = await db.bankAccount.findMany({
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    })

    return NextResponse.json({ bankAccounts })
  } catch (error) {
    console.error("Error fetching bank accounts:", error)
    return NextResponse.json({ message: "Failed to fetch bank accounts" }, { status: 500 })
  }
}

