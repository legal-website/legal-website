import { NextResponse, type NextRequest } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const invoiceId = searchParams.get("invoice_id")

  if (!invoiceId) {
    return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 })
  }

  try {
    // Check if invoice exists
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // For direct bank transfers, we check if a receipt has been uploaded
    if (invoice.paymentReceipt) {
      return NextResponse.json({
        success: true,
        email: invoice.customerEmail,
        status: invoice.status,
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: "Payment receipt not uploaded yet",
      },
      { status: 400 },
    )
  } catch (error: any) {
    console.error("Error verifying payment:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}

