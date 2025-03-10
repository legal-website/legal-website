import { NextResponse, type NextRequest } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("Fetching invoice with ID:", params.id)

    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
    })

    if (!invoice) {
      console.log("Invoice not found")
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    console.log("Invoice found:", invoice)

    return NextResponse.json({ invoice })
  } catch (error: any) {
    console.error("Error fetching invoice:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

