import { NextResponse, type NextRequest } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { uploadToCloudinary } from "@/lib/cloudinary"

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const invoiceId = formData.get("invoiceId") as string
    const file = formData.get("file") as File

    if (!invoiceId) {
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 })
    }

    if (!file) {
      return NextResponse.json({ error: "Receipt file is required" }, { status: 400 })
    }

    // Check if invoice exists and belongs to user
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    if (invoice.customerEmail !== (session.user as any).email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Upload receipt to Cloudinary
    const receiptUrl = await uploadToCloudinary(file)

    // Update invoice with receipt URL - only update the receipt and status, not the amount
    const updatedInvoice = await db.invoice.update({
      where: { id: invoiceId },
      data: {
        paymentReceipt: receiptUrl,
        status: "pending_approval", // Change status to pending approval
        // We're not modifying the amount or items here, preserving the original values
      },
    })

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice,
    })
  } catch (error: any) {
    console.error("Error uploading receipt:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

