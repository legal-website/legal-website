import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch ALL invoices for the current user without any filtering
    const invoices = await prisma.invoice.findMany({
      where: { userId: session.user.id as string },
      orderBy: { createdAt: "desc" },
    })

    // Debug log to see what invoices are being returned
    console.log(`Found ${invoices.length} invoices for user ${session.user.id}`)

    return NextResponse.json({ invoices })
  } catch (error) {
    console.error("Error fetching user invoices:", error)
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 })
  }
}

