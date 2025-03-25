import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { createMessage } from "@/lib/actions/ticket-actions"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const content = formData.get("content") as string
    const ticketId = formData.get("ticketId") as string
    const files = formData.getAll("files") as File[]

    if (!content || !ticketId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Call the existing createMessage function with the files
    const result = await createMessage({ content, ticketId }, files.length > 0 ? files : undefined)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, messageId: result.messageId })
  } catch (error) {
    console.error("Error creating message:", error)
    return NextResponse.json({ error: "Failed to create message" }, { status: 500 })
  }
}

