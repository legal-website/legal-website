import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const invoiceId = params.id

    if (!invoiceId) {
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 })
    }

    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      invoice,
    })
  } catch (error: any) {
    console.error("Error fetching invoice:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An error occurred while fetching the invoice",
      },
      { status: 500 },
    )
  }
}

