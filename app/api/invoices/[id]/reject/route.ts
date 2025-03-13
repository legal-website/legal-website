import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("Rejecting invoice:", params.id)

    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== "ADMIN") {
      console.log("Unauthorized rejection attempt")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const invoiceId = params.id

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

    console.log("Invoice rejected successfully")

    // You could add email notification here if needed
    // try {
    //   await sendPaymentRejectionEmail(invoice.customerEmail, invoice.customerName, invoiceId)
    //   console.log("Rejection email sent")
    // } catch (emailError) {
    //   console.error("Error sending rejection email:", emailError)
    // }

    return NextResponse.json({ success: true, invoice: updatedInvoice })
  } catch (error: any) {
    console.error("Error rejecting invoice:", error)
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 })
  }
}

