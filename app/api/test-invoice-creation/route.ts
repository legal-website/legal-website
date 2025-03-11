import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    // Create a test invoice directly using Prisma
    const testInvoice = await db.invoice.create({
      data: {
        invoiceNumber: `TEST-${Date.now()}`,
        customerName: "Test Customer",
        customerEmail: "test@example.com",
        amount: 99.99,
        status: "pending",
        items: JSON.stringify([
          {
            id: "test-item-1",
            tier: "BASIC",
            price: 99.99,
          },
        ]),
      },
    })

    return NextResponse.json({
      success: true,
      message: "Test invoice created successfully",
      invoice: testInvoice,
    })
  } catch (error: any) {
    console.error("Test invoice creation failed:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Test invoice creation failed",
        message: error.message,
        code: error.code,
        meta: error.meta,
      },
      {
        status: 500,
      },
    )
  }
}

