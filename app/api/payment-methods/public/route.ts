import { NextResponse, type NextRequest } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const searchParams = req.nextUrl.searchParams
    const type = searchParams.get("type")

    // Build the where clause based on filters
    const where: any = {
      isActive: true, // Only return active payment methods
    }

    if (type) {
      where.type = type
    }

    // Fetch payment methods from database
    const paymentMethods = await db.paymentMethod.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        type: true,
        accountTitle: true,
        accountNumber: true,
        iban: true,
        swiftCode: true,
        branchName: true,
        branchCode: true,
        bankName: true,
        providerName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
      },
    })

    return NextResponse.json({ paymentMethods })
  } catch (error: any) {
    console.error("Error fetching public payment methods:", error)
    return NextResponse.json({ error: error.message, paymentMethods: [] }, { status: 500 })
  }
}

