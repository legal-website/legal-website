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

    const userId = (session.user as any).id
    const formData = await req.formData()
    const invoiceId = formData.get("invoiceId") as string
    const file = formData.get("file") as File

    if (!invoiceId) {
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 })
    }

    if (!file) {
      return NextResponse.json({ error: "Receipt file is required" }, { status: 400 })
    }

    // Check if invoice exists and belongs to the user
    const invoice = await db.invoice.findFirst({
      where: {
        id: invoiceId,
        userId,
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found or does not belong to you" }, { status: 404 })
    }

    // Upload receipt to Cloudinary
    const receiptUrl = await uploadToCloudinary(file)

    // Update invoice with receipt URL
    const updatedInvoice = await db.invoice.update({
      where: { id: invoiceId },
      data: {
        paymentReceipt: receiptUrl,
        status: "awaiting_approval",
      },
    })

    return NextResponse.json({ success: true, invoice: updatedInvoice })
  } catch (error: any) {
    console.error("Error uploading receipt:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

