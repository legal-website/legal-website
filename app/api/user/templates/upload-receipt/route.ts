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

    // Parse existing items if they exist
    let existingItems = {}
    try {
      if (existingInvoice?.items) {
        if (typeof existingInvoice.items === "string") {
          existingItems = JSON.parse(existingInvoice.items)
        } else {
          existingItems = existingInvoice.items
        }
      }
    } catch (e) {
      console.error("Error parsing existing items:", e)
    }

    // Update the invoice with the receipt URL and template information
    const updatedInvoice = await db.invoice.update({
      where: { id: invoiceId },
      data: {
        paymentReceipt: receiptUrl,
        // Merge existing items with template information
        items: JSON.stringify({
          ...existingItems,
          isTemplateInvoice: true,
          templateId: templateId || invoiceId,
          templateName:
            templateName ||
            // Try to get template name from existing items if not provided
            (typeof existingItems === "object" && "templateName" in existingItems
              ? existingItems.templateName
              : // If all else fails, try to get it from items array
                Array.isArray(existingItems) && existingItems.length > 0 && existingItems[0].tier
                ? existingItems[0].tier
                : "Unknown Template"),
        }),
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

