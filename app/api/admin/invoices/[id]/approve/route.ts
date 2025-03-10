import { NextResponse, type NextRequest } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // In a real app, you would check admin authentication here

    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Update invoice status to paid
    const updatedInvoice = await prisma.invoice.update({
      where: { id: params.id },
      data: {
        status: "paid",
        paymentDate: new Date(),
      },
    })

    // Send email notification to customer
    // This would be implemented with your email service

    return NextResponse.json({ success: true, invoice: updatedInvoice })
  } catch (error: any) {
    console.error("Error approving payment:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

