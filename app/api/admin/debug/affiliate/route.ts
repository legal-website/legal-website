import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

// Define types for our data
interface InvoiceWithMetadata {
  id: string
  invoiceNumber: string
  amount: number
  status: string
  metadata?: string | null
}

interface ConversionWithRelations {
  id: string
  orderId: string
  amount: number
  commission: number
  status: string
  link: {
    user: {
      email: string
    }
  }
  createdAt: Date
}

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(req.url)
    const email = url.searchParams.get("email")

    if (!email) {
      return NextResponse.json({ error: "Email parameter is required" }, { status: 400 })
    }

    // Get invoices for this email
    const invoices = (await prisma.invoice.findMany({
      where: { customerEmail: email },
    })) as InvoiceWithMetadata[]

    // Extract affiliate codes from invoice metadata
    const invoiceData = invoices.map((invoice: InvoiceWithMetadata) => {
      let affiliateCode = null
      if (invoice.metadata) {
        try {
          const metadata = JSON.parse(invoice.metadata as string)
          affiliateCode = metadata.affiliateCode
        } catch (e) {
          console.error(`Error parsing metadata for invoice ${invoice.id}:`, e)
        }
      }

      return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount,
        status: invoice.status,
        affiliateCode,
      }
    })

    // Get conversions for this email
    const conversions = (await prisma.affiliateConversion.findMany({
      where: { customerEmail: email },
      include: {
        link: {
          include: {
            user: true,
          },
        },
      },
    })) as ConversionWithRelations[]

    return NextResponse.json({
      email,
      invoices: invoiceData,
      conversions: conversions.map((conv: ConversionWithRelations) => ({
        id: conv.id,
        orderId: conv.orderId,
        amount: conv.amount,
        commission: conv.commission,
        status: conv.status,
        affiliateUser: conv.link.user.email,
        createdAt: conv.createdAt,
      })),
    })
  } catch (error: any) {
    console.error("Error retrieving debug information:", error)
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 })
  }
}

