import { NextResponse, type NextRequest } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    // Get session to check if user is authenticated
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse request body
    const data = await req.json()

    // Ensure items is a string (JSON stringified array)
    const formattedData = {
      ...data,
      // Convert items array to a JSON string if it's not already a string
      items: typeof data.items === "string" ? data.items : JSON.stringify(data.items),
    }

    // Create invoice in database
    const invoice = await prisma.invoice.create({
      data: formattedData,
    })

    return NextResponse.json({ success: true, invoice }, { status: 201 })
  } catch (error) {
    console.error("Error creating invoice:", error)
    return NextResponse.json(
      {
        error: "Failed to create invoice",
        message: (error as Error).message,
      },
      { status: 500 },
    )
  }
}

