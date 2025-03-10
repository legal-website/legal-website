import { NextResponse, type NextRequest } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { items, email } = await req.json()

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 })
    }

    // Calculate total amount
    const total = items.reduce((sum: number, item: any) => {
      const itemPrice = typeof item.price === "number" ? item.price : Number.parseFloat(item.price)
      const stateFee = item.stateFee
        ? typeof item.stateFee === "number"
          ? item.stateFee
          : Number.parseFloat(item.stateFee)
        : 0
      const discount = item.discount
        ? typeof item.discount === "number"
          ? item.discount
          : Number.parseFloat(item.discount)
        : 0

      return sum + itemPrice + stateFee - discount
    }, 0)

    // Generate invoice number (format: INV-YYYY-XXXX)
    const date = new Date()
    const year = date.getFullYear()

    // Get the count of invoices for this year to generate sequential number
    const invoiceCount = await prisma.invoice.count({
      where: {
        invoiceNumber: {
          startsWith: `INV-${year}`,
        },
      },
    })

    const sequentialNumber = (invoiceCount + 1).toString().padStart(4, "0")
    const invoiceNumber = `INV-${year}-${sequentialNumber}`

    // Create invoice with pending status
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        customerName: email ? email.split("@")[0] : "Customer", // Default name if email provided
        customerEmail: email || "",
        amount: total,
        status: "pending",
        items: items.map((item: any) => ({
          id: item.id,
          tier: item.tier,
          price: typeof item.price === "number" ? item.price : Number.parseFloat(item.price),
          stateFee: item.stateFee
            ? typeof item.stateFee === "number"
              ? item.stateFee
              : Number.parseFloat(item.stateFee)
            : undefined,
          state: item.state || undefined,
          discount: item.discount
            ? typeof item.discount === "number"
              ? item.discount
              : Number.parseFloat(item.discount)
            : undefined,
        })),
      },
    })

    // Return the invoice page URL
    return NextResponse.json({
      url: `${process.env.NEXT_PUBLIC_APP_URL}/invoice/${invoice.id}`,
      invoiceId: invoice.id, // Add this line to return the invoice ID
    })
  } catch (error: any) {
    console.error("Error creating invoice:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

