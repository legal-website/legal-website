import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    console.log("Fetching invoices from API route")

    // Get the session
    const session = await getServerSession(authOptions)

    // Debug session information
    console.log(
      "Session:",
      JSON.stringify(
        {
          exists: !!session,
          user: session?.user
            ? {
                id: session.user.id,
                email: session.user.email,
                role: (session.user as any).role,
              }
            : null,
        },
        null,
        2,
      ),
    )

    // Check if user is authenticated
    if (!session || !session.user) {
      console.log("No session found - user is not authenticated")
      return NextResponse.json({ error: "You must be logged in to access this resource" }, { status: 401 })
    }

    // Check if user has admin role
    if ((session.user as any).role !== "ADMIN") {
      console.log("User does not have admin role:", (session.user as any).role)
      return NextResponse.json({ error: "You do not have permission to access this resource" }, { status: 403 })
    }

    console.log("User authenticated as admin, fetching invoices")

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

