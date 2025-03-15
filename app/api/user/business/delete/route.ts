import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

interface DeleteDocumentsRequest {
  documentIds: string[]
}

// Define a type for the document with just the ID
interface DocumentWithId {
  id: string
}

export async function DELETE(req: NextRequest) {
  console.log("DELETE /api/user/documents/business/delete - Request received")

  try {
    // Get session
    const session = await getServerSession(authOptions)
    console.log("Session check:", session ? "Session exists" : "No session")

    if (!session || !session.user) {
      console.log("Unauthorized: No valid session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user ID
    const userId = (session.user as any).id
    const userEmail = session.user.email
    console.log(`User identified: ${userEmail} (ID: ${userId})`)

    if (!userEmail) {
      console.log("Bad request: User email not found")
      return NextResponse.json({ error: "User email not found" }, { status: 400 })
    }

    // Parse request body
    let documentIds: string[] = []
    let body: Partial<DeleteDocumentsRequest> = {}

    try {
      const text = await req.text()
      console.log("Request body text:", text)

      if (text) {
        body = JSON.parse(text) as Partial<DeleteDocumentsRequest>
        documentIds = body.documentIds || []
        console.log(`Parsed document IDs: ${documentIds.join(", ")}`)
      }
    } catch (error) {
      console.error("Error parsing request body:", error)
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: error instanceof Error ? error.message : "Unknown parsing error",
        },
        { status: 400 },
      )
    }

    if (!documentIds.length) {
      console.log("Bad request: No document IDs provided")
      return NextResponse.json({ error: "No document IDs provided" }, { status: 400 })
    }

    // Get user's business
    console.log(`Finding business for user ${userId}`)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { business: true },
    })

    if (!user?.business) {
      console.log("Not found: Business not found for user")
      return NextResponse.json({ error: "Business not found" }, { status: 404 })
    }

    const businessId = user.business.id
    console.log(`Business found: ${businessId}`)

    // Verify documents exist and belong to business
    console.log(`Verifying ${documentIds.length} documents belong to business ${businessId}`)
    const documents = await prisma.document.findMany({
      where: {
        id: { in: documentIds },
        businessId,
      },
      select: { id: true },
    })

    console.log(`Found ${documents.length} of ${documentIds.length} requested documents`)

    if (documents.length !== documentIds.length) {
      // Fix the TypeScript error by properly typing the 'doc' parameter
      const foundIds = documents.map((doc: DocumentWithId) => doc.id)
      const missingIds = documentIds.filter((id) => !foundIds.includes(id))
      console.log(`Missing documents: ${missingIds.join(", ")}`)

      return NextResponse.json(
        {
          error: "Some documents not found or don't belong to your business",
          details: {
            requested: documentIds,
            found: foundIds,
            missing: missingIds,
          },
        },
        { status: 403 },
      )
    }

    // Delete the documents
    console.log(`Deleting ${documentIds.length} documents`)
    try {
      const deleteResult = await prisma.document.deleteMany({
        where: {
          id: { in: documentIds },
          businessId,
        },
      })

      console.log(`Delete result: ${deleteResult.count} documents deleted`)

      if (deleteResult.count !== documentIds.length) {
        console.warn(`Warning: Deleted ${deleteResult.count} of ${documentIds.length} documents`)
      }

      // Return a successful response
      return NextResponse.json({
        success: true,
        message: `${deleteResult.count} document(s) deleted successfully`,
        count: deleteResult.count,
      })
    } catch (deleteError) {
      console.error("Prisma delete error:", deleteError)
      return NextResponse.json(
        {
          error: "Database error while deleting documents",
          details: deleteError instanceof Error ? deleteError.message : "Unknown database error",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Unhandled error in delete route:", error)
    return NextResponse.json(
      {
        error: "Failed to delete documents",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.stack : undefined) : undefined,
      },
      { status: 500 },
    )
  }
}

