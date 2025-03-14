import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userRole = (session.user as any).role
    if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }

    // Get request body
    const body = await req.json()
    const { invoiceId, status, specificTemplateId } = body

    if (!invoiceId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Find the invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Update the invoice status
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status,
        paymentDate: status === "paid" ? new Date() : undefined,
      },
    })

    // Note: We're not automatically unlocking the template anymore
    // Instead, we'll let the client-side handle the unlocking notification

    return NextResponse.json({
      success: true,
      message: `Invoice status updated to ${status}`,
      invoice: updatedInvoice,
    })
  } catch (error) {
    console.error("Error updating template invoice status:", error)
    return NextResponse.json({ error: "Failed to update invoice status" }, { status: 500 })
  }
}

