import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

const prisma = new PrismaClient()

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
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    })

    if (!invoice) {
      console.log("Invoice not found:", invoiceId)
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    console.log("Found invoice:", invoice.invoiceNumber)

    // Update invoice status to cancelled
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: "cancelled" },
    })

    console.log("Invoice rejected successfully")

    return NextResponse.json({ success: true, invoice: updatedInvoice })
  } catch (error: any) {
    console.error("Error rejecting invoice:", error)
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 })
  }
}

