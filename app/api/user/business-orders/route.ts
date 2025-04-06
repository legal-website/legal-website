import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch ALL invoices for the current user without any filtering
    const invoices = await db.invoice.findMany({
      where: {
        userId: session.user.id as string,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    console.log(`[business-orders] Found ${invoices.length} invoices for user ${session.user.id}`)

    return NextResponse.json({ invoices })
  } catch (error) {
    console.error("Error fetching business orders:", error)
    return NextResponse.json({ error: "Failed to fetch business orders" }, { status: 500 })
  }
}

