import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get request body
    const body = await req.json()
    const { invoiceId, status } = body

    if (!invoiceId) {
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 })
    }

    if (!status || !["paid", "pending", "cancelled"].includes(status)) {
      return NextResponse.json({ error: "Valid status is required" }, { status: 400 })
    }

    // Find the invoice
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Update the invoice status
    const updatedInvoice = await db.invoice.update({
      where: { id: invoiceId },
      data: {
        status,
        // If status is paid, set payment date
        ...(status === "paid" ? { paymentDate: new Date() } : {}),
      },
    })

    // Log the update for debugging
    console.log(`Template invoice ${invoiceId} status updated to ${status}`)

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice,
    })
  } catch (error: any) {
    console.error("Error updating template invoice status:", error)
    return NextResponse.json({ error: "Failed to update invoice status", message: error.message }, { status: 500 })
  }
}

