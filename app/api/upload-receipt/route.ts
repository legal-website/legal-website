import { NextResponse, type NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { writeFile } from "fs/promises"
import { join } from "path"
import { v4 as uuidv4 } from "uuid"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const invoiceId = formData.get("invoiceId") as string
    const receipt = formData.get("receipt") as File

    if (!invoiceId || !receipt) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if invoice exists
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Create unique filename
    const fileExtension = receipt.name.split(".").pop()
    const fileName = `${uuidv4()}.${fileExtension}`

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public/uploads")

    // Convert file to buffer
    const bytes = await receipt.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Write file to disk
    const filePath = join(uploadsDir, fileName)
    await writeFile(filePath, buffer)

    // Update invoice with receipt URL
    const receiptUrl = `/uploads/${fileName}`
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        paymentReceipt: receiptUrl,
      },
    })

    return NextResponse.json({
      success: true,
      receiptUrl,
    })
  } catch (error: any) {
    console.error("Error uploading receipt:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}

