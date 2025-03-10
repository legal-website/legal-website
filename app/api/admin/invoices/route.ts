import { NextResponse, type NextRequest } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    // In a real app, you would check admin authentication here

    const invoices = await prisma.invoice.findMany({
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({ invoices })
  } catch (error: any) {
    console.error("Error fetching invoices:", error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error occurred",
        stack: process.env.NODE_ENV !== "production" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

