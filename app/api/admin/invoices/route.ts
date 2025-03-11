import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    console.log("Fetching invoices from API route")
    const session = await getServerSession(authOptions)

    console.log("Session:", session)
    if (!session || (session.user as any).role !== "ADMIN") {
      console.log("Unauthorized access attempt")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const invoices = await prisma.invoice.findMany({
      orderBy: {
        createdAt: "desc",
      },
    })

    console.log(`Found ${invoices.length} invoices`)

    // Parse the items JSON field for each invoice
    const formattedInvoices = invoices.map((invoice: any) => ({
      ...invoice,
      items: typeof invoice.items === "string" ? JSON.parse(invoice.items) : invoice.items,
    }))

    return NextResponse.json({ invoices: formattedInvoices })
  } catch (error) {
    console.error("Error fetching invoices:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

