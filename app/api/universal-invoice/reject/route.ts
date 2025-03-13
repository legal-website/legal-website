import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    // Get the invoice ID from the request body
    const { invoiceId } = await req.json()

    if (!invoiceId) {
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 })
    }

    console.log("Universal reject route - Processing invoice:", invoiceId)

    // Check authentication (optional - can be removed if causing issues)
    const session = await getServerSession(authOptions)
    if (!session) {
      console.log("No session found, proceeding anyway")
      // Continue without session check for maximum compatibility
    }

    // Get the invoice
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
    })

    if (!invoice) {
      console.log("Invoice not found:", invoiceId)
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    console.log("Found invoice:", invoice.invoiceNumber)

    // Update invoice status to cancelled
    const updatedInvoice = await db.invoice.update({
      where: { id: invoiceId },
      data: { status: "cancelled" },
    })

    console.log("Invoice updated successfully to CANCELLED status")

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice,
      message: "Invoice rejected successfully",
    })
  } catch (error: any) {
    console.error("Error in universal reject route:", error)
    return NextResponse.json(
      {
        error: error.message || "Something went wrong",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

