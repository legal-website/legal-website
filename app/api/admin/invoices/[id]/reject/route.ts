import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Role } from "@/lib/enums"
import { sendPaymentRejectionEmail } from "@/lib/auth-service"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("Rejecting invoice:", params.id)

    const session = await getServerSession(authOptions)

    // Check if user is authenticated and is an admin
    if (!session || (session.user as any).role !== Role.ADMIN) {
      console.log("Unauthorized rejection attempt")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const invoiceId = params.id
    const { reason } = await req.json()

    // Get the invoice
    const invoiceResult = (await db.$queryRaw`
      SELECT * FROM Invoice WHERE id = ${invoiceId}
    `) as any[]

    if (!invoiceResult || invoiceResult.length === 0) {
      console.log("Invoice not found:", invoiceId)
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    const invoice = invoiceResult[0]

    console.log("Found invoice:", invoice.invoiceNumber)

    // Update invoice status to rejected
    await db.$executeRaw`
      UPDATE Invoice 
      SET status = 'rejected', rejectionReason = ${reason || null}
      WHERE id = ${invoiceId}
    `

    console.log("Invoice rejected successfully")

    // Send rejection email
    try {
      // Check if the user is logged in (has a userId in the invoice)
      const isLoggedIn = !!invoice.userId
      await sendPaymentRejectionEmail(
        invoice.customerEmail,
        invoice.customerName,
        invoiceId,
        reason || "Payment verification failed",
        isLoggedIn,
      )
      console.log("Rejection email sent, isLoggedIn:", isLoggedIn)
    } catch (emailError) {
      console.error("Error sending rejection email:", emailError)
    }

    // Get the updated invoice for the response
    const updatedInvoiceResult = (await db.$queryRaw`
      SELECT * FROM Invoice WHERE id = ${invoiceId}
    `) as any[]

    return NextResponse.json({
      success: true,
      invoice: updatedInvoiceResult && updatedInvoiceResult.length > 0 ? updatedInvoiceResult[0] : null,
    })
  } catch (error: any) {
    console.error("Error rejecting invoice:", error)
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 })
  }
}

