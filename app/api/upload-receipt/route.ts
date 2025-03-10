import { NextResponse, type NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { writeFile } from "fs/promises"
import path from "path"
import { mkdir } from "fs/promises"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const receipt = formData.get("receipt") as File
    const invoiceId = formData.get("invoiceId") as string

    if (!receipt || !invoiceId) {
      return NextResponse.json({ error: "Receipt file and invoice ID are required" }, { status: 400 })
    }

    // Check if invoice exists
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "public/uploads")
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      console.error("Error creating uploads directory:", error)
    }

    // Generate a unique filename
    const timestamp = Date.now()
    const filename = `receipt-${invoiceId}-${timestamp}${path.extname(receipt.name)}`
    const filepath = path.join(uploadsDir, filename)

    // Convert file to buffer and save it
    const bytes = await receipt.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Update invoice with receipt URL
    const receiptUrl = `/uploads/${filename}`
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { paymentReceipt: receiptUrl },
    })

    return NextResponse.json({
      success: true,
      receiptUrl,
      message: "Receipt uploaded successfully",
    })
  } catch (error: any) {
    console.error("Error uploading receipt:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

