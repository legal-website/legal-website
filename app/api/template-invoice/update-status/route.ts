import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// Define a type for the Document model
interface Document {
  id: string
  name: string
  category: string
  type: string
  fileUrl: string
  businessId: string
  createdAt?: Date
  updatedAt?: Date
}

export async function POST(req: Request) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get request body
    const body = await req.json()
    const { invoiceId, status, specificTemplateId } = body

    if (!invoiceId || !status) {
      return NextResponse.json({ error: "Invoice ID and status are required" }, { status: 400 })
    }

    console.log(`Processing template invoice ${invoiceId} with status ${status}`)
    if (specificTemplateId) {
      console.log(`Specific template ID provided: ${specificTemplateId}`)
    }

    // Get the invoice with user details
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: { user: true },
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    console.log(`Found invoice: ${invoice.invoiceNumber} for user ${invoice.userId}`)
    console.log(`Raw invoice items: ${JSON.stringify(invoice.items)}`)
    console.log(`Invoice amount: $${invoice.amount}`)

    // Update the invoice status
    const updatedInvoice = await db.invoice.update({
      where: { id: invoiceId },
      data: {
        status,
        paymentDate: status === "paid" ? new Date() : undefined,
      },
    })

    console.log(`Updated invoice status to ${status}`)

    // Return success response without unlocking templates
    return NextResponse.json({
      success: true,
      invoice: updatedInvoice,
      message: "Invoice status updated successfully. Template access is managed separately.",
    })
  } catch (error: any) {
    console.error("Error updating invoice status:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An error occurred while updating invoice status",
      },
      { status: 500 },
    )
  }
}

