import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const invoices = await prisma.invoice.findMany({
      orderBy: {
        createdAt: "desc",
      },
    })

    // Parse the items JSON field for each invoice
    const formattedInvoices = invoices.map((invoice: { items: string }) => ({
      ...invoice,
      items: typeof invoice.items === "string" ? JSON.parse(invoice.items) : invoice.items,
    }))

    return NextResponse.json({ invoices: formattedInvoices })
  } catch (error) {
    console.error("Error fetching invoices:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

