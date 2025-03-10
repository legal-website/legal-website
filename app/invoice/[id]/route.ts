import { NextResponse, type NextRequest } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("Fetching invoice with ID:", params.id) // Add logging

    // Use select to only fetch the fields we need
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        invoiceNumber: true,
        customerName: true,
        customerEmail: true,
        amount: true,
        status: true,
        items: true,
        paymentReceipt: true,
        createdAt: true,
      },
    })

    if (!invoice) {
      console.log("Invoice not found") // Add logging
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    console.log("Invoice found:", invoice) // Add logging
    return NextResponse.json({ invoice })
  } catch (error: any) {
    console.error("Error fetching invoice:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

