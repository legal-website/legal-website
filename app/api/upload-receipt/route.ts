import { NextResponse, type NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { uploadToCloudinary } from "@/lib/cloudinary"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const receipt = formData.get("receipt") as File
    const invoiceId = formData.get("invoiceId") as string

    if (!receipt || !invoiceId) {
      return NextResponse.json({ error: "Receipt file and invoice ID are required" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "application/pdf"]
    if (!allowedTypes.includes(receipt.type)) {
      return NextResponse.json({ error: "Invalid file type. Please upload an image or PDF." }, { status: 400 })
    }

    // Check if invoice exists
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Upload file to Cloudinary
    console.log("Uploading receipt to Cloudinary...")
    const receiptUrl = await uploadToCloudinary(receipt)
    console.log("Receipt uploaded successfully:", receiptUrl)

    // Update invoice with receipt URL and set payment date to now
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        paymentReceipt: receiptUrl,
        paymentDate: new Date(),
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      receiptUrl,
      message: "Receipt uploaded successfully",
    })
  } catch (error: any) {
    console.error("Error uploading receipt:", error)
    return NextResponse.json(
      {
        error: error.message || "An error occurred while uploading the receipt",
      },
      { status: 500 },
    )
  }
}

