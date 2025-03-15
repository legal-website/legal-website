import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id
    const userEmail = session.user.email

    if (!userEmail) {
      return NextResponse.json({ error: "User email not found" }, { status: 400 })
    }

    // Get user's business
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { business: true },
    })

    if (!user?.business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 })
    }

    const businessId = user.business.id

    // Get document IDs to delete from request body
    let documentIds: string[] = []
    try {
      const body = await req.json()
      documentIds = body.documentIds || []
    } catch (error) {
      console.error("Error parsing request body:", error)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    if (!documentIds.length) {
      return NextResponse.json({ error: "No document IDs provided" }, { status: 400 })
    }

    // Verify that all documents belong to this business
    const documents = await prisma.document.findMany({
      where: {
        id: { in: documentIds },
        businessId,
      },
    })

    if (documents.length !== documentIds.length) {
      return NextResponse.json({ error: "Some documents not found or don't belong to your business" }, { status: 403 })
    }

    // Delete the documents
    await prisma.document.deleteMany({
      where: {
        id: { in: documentIds },
        businessId,
      },
    })

    // Return a successful response
    return NextResponse.json({
      success: true,
      message: `${documentIds.length} document(s) deleted successfully`,
    })
  } catch (error) {
    console.error("Error deleting documents:", error)
    return NextResponse.json(
      {
        error: "Failed to delete documents",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

