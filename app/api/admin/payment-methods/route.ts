import { NextResponse, type NextRequest } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams
    const type = searchParams.get("type")

    // Build the where clause based on filters
    const where: any = {}
    if (type) {
      where.type = type
    }

    // Fetch payment methods from database
    const paymentMethods = await db.paymentMethod.findMany({
      where,
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ paymentMethods })
  } catch (error: any) {
    console.error("Error fetching payment methods:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get request body
    const body = await req.json()

    // Validate required fields
    if (!body.type || !body.name || !body.accountTitle || !body.accountNumber) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate mobile wallet account number (must be 11 digits)
    if (body.type === "mobile_wallet" && !/^\d{11}$/.test(body.accountNumber)) {
      return NextResponse.json({ error: "Mobile wallet account number must be 11 digits" }, { status: 400 })
    }

    // Create new payment method
    const paymentMethod = await db.paymentMethod.create({
      data: {
        type: body.type,
        name: body.name,
        accountTitle: body.accountTitle,
        accountNumber: body.accountNumber,
        iban: body.iban || null,
        swiftCode: body.swiftCode || null,
        branchName: body.branchName || null,
        branchCode: body.branchCode || null,
        bankName: body.bankName || null,
        providerName: body.providerName || null,
        isActive: body.isActive !== false, // Default to true if not specified
        createdBy: session.user.id,
      },
    })

    return NextResponse.json({ paymentMethod })
  } catch (error: any) {
    console.error("Error creating payment method:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

