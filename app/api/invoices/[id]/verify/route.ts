import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const invoiceId = params.id

    // Get the invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      invoice: {
        id: invoice.id,
        customerName: invoice.customerName,
        customerEmail: invoice.customerEmail,
        amount: invoice.amount,
        status: invoice.status,
      },
      message: "Invoice verified successfully",
    })
  } catch (error: any) {
    console.error("Error verifying invoice:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

