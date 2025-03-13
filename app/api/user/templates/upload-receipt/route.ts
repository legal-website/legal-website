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

    // Parse form data
    const formData = await req.formData()
    const file = formData.get("file") as File
    const invoiceId = formData.get("invoiceId") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!invoiceId) {
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 })
    }

    // Verify the invoice belongs to the user
    const invoice = await db.invoice.findUnique({
      where: {
        id: invoiceId,
        userId: userId,
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Upload the file to Cloudinary
    const receiptUrl = await uploadToCloudinary(file)

    // Update the invoice with the receipt URL
    await db.invoice.update({
      where: {
        id: invoiceId,
      },
      data: {
        paymentReceipt: receiptUrl,
        status: "pending_approval", // Change status to pending approval
      },
    })

    return NextResponse.json({
      success: true,
      message: "Receipt uploaded successfully",
      receiptUrl: receiptUrl,
    })
  } catch (error: any) {
    console.error("Error uploading receipt:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

