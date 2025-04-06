import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import prisma from "@/lib/db"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET() {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the user ID from the session
    const userId = session.user.id

    // Fetch all invoices for the user without any filtering
    const invoices = await prisma.invoice.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    console.log(`Found ${invoices.length} invoices for user ${userId}`)

    return NextResponse.json({ invoices })
  } catch (error) {
    console.error("Error fetching business orders:", error)
    return NextResponse.json({ error: "Failed to fetch business orders" }, { status: 500 })
  }
}

