import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { uploadToCloudinary } from "@/lib/cloudinary"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File
    const invoiceId = formData.get("invoiceId") as string
    const isTemplateInvoice = formData.get("isTemplateInvoice") as string
    const templateName = formData.get("templateName") as string // Get template name from form data

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!invoiceId) {
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 })
    }

    // Upload file to Cloudinary
    const receiptUrl = await uploadToCloudinary(file)

    if (!receiptUrl) {
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
    }

    // Update the invoice with the receipt URL and template information
    const updatedInvoice = await db.invoice.update({
      where: { id: invoiceId },
      data: {
        paymentReceipt: receiptUrl,
        // Add template information to the invoice items
        ...(isTemplateInvoice === "true"
          ? {
              items: JSON.stringify({
                isTemplateInvoice: true,
                templateId: invoiceId,
                templateName: templateName || "Unknown Template", // Include template name
              }),
            }
          : {}),
      },
    })

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice,
    })
  } catch (error: any) {
    console.error("Error uploading receipt:", error)
    return NextResponse.json({ error: "Failed to upload receipt", message: error.message }, { status: 500 })
  }
}

