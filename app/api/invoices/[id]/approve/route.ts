import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { sendPaymentApprovalEmail } from "@/lib/auth-service"

const prisma = new PrismaClient()

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const invoiceId = params.id

    // Get the invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Update invoice status to paid
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: "paid" },
    })

    // Send approval email
    await sendPaymentApprovalEmail(invoice.customerEmail, invoice.customerName, invoiceId)

    return NextResponse.json({ success: true, invoice: updatedInvoice })
  } catch (error: any) {
    console.error("Error approving invoice:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

