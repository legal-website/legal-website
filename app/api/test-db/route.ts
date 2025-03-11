import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    // Test database connection by counting invoices
    const count = await db.invoice.count()

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      invoiceCount: count,
    })
  } catch (error: any) {
    console.error("Database connection test failed:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Database connection failed",
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      {
        status: 500,
      },
    )
  }
}

