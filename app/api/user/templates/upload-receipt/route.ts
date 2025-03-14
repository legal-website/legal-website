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
    const templateName = formData.get("templateName") as string
    const templateId = formData.get("templateId") as string
    const price = formData.get("price") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!invoiceId) {
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 })
    }

    // Get the existing invoice to preserve any existing items
    const existingInvoice = await db.invoice.findUnique({
      where: { id: invoiceId },
    })

    // Upload file to Cloudinary
    const receiptUrl = await uploadToCloudinary(file)

    if (!receiptUrl) {
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
    }

    // Ensure we have a valid template name
    const finalTemplateName = templateName || "Unknown Template"

    // Create a clean items object with the template information
    const templateItems = {
      isTemplateInvoice: true,
      templateName: finalTemplateName,
      templateId: templateId || invoiceId,
      type: "template",
      price: Number.parseFloat(price) || 0,
    }

    // Update the invoice with the receipt URL and template information
    const updatedInvoice = await db.invoice.update({
      where: { id: invoiceId },
      data: {
        paymentReceipt: receiptUrl,
        items: JSON.stringify(templateItems),
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

