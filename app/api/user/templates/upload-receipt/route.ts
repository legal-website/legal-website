import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
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

    // Upload file to Cloudinary
    const receiptUrl = await uploadToCloudinary(file)

    if (!receiptUrl) {
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
    }

    // Ensure we have a valid template name
    const finalTemplateName = templateName || "Unknown Template"
    const priceValue = Number.parseFloat(price) || 0

    // Create a structure that works with both formats the admin page checks
    // Format 1: Direct templateName property
    // Format 2: Array with tier property
    const templateItems = {
      isTemplateInvoice: true,
      templateName: finalTemplateName,
      templateId: templateId || invoiceId,
      type: "template",
      price: priceValue,
      // Add an array item with tier property to ensure compatibility
      0: {
        tier: finalTemplateName,
        price: priceValue,
        type: "template",
      },
    }

    console.log("Storing template items:", JSON.stringify(templateItems, null, 2))

    // Update the invoice with the receipt URL and template information
    const updatedInvoice = await prisma.invoice.update({
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

