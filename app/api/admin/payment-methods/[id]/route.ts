import { NextResponse, type NextRequest } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// GET - Fetch a specific payment method
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const paymentMethod = await db.paymentMethod.findUnique({
      where: { id: params.id },
    })

    if (!paymentMethod) {
      return NextResponse.json({ error: "Payment method not found" }, { status: 404 })
    }

    return NextResponse.json({ paymentMethod })
  } catch (error: any) {
    console.error("Error fetching payment method:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update a payment method
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()

    // Validate required fields
    if (!data.name || !data.accountTitle || !data.accountNumber) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate mobile wallet account number (must be 11 digits)
    if (data.type === "mobile_wallet" && !/^\d{11}$/.test(data.accountNumber)) {
      return NextResponse.json({ error: "Mobile wallet account number must be 11 digits" }, { status: 400 })
    }

    // Get existing payment method
    const existingMethod = await db.paymentMethod.findUnique({
      where: { id: params.id },
    })

    if (!existingMethod) {
      return NextResponse.json({ error: "Payment method not found" }, { status: 404 })
    }

    // Update the payment method
    const updatedMethod = await db.paymentMethod.update({
      where: { id: params.id },
      data: {
        name: data.name,
        accountTitle: data.accountTitle,
        accountNumber: data.accountNumber,
        iban: data.iban || null,
        swiftCode: data.swiftCode || null,
        branchName: data.branchName || null,
        branchCode: data.branchCode || null,
        bankName: data.bankName || null,
        providerName: data.providerName || null,
        isActive: data.isActive,
      },
    })

    return NextResponse.json({ paymentMethod: updatedMethod })
  } catch (error: any) {
    console.error("Error updating payment method:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete a payment method
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete the payment method
    await db.paymentMethod.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting payment method:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

