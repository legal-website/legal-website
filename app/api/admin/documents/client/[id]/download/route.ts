import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getSignedUrl } from "@/lib/cloudinary"

// GET /api/admin/documents/client/[id]/download
// Get a signed download URL for a document (admin access)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const user = await db.user.findUnique({
      where: { id: (session.user as any).id },
    })

    if (user?.role !== "ADMIN" && user?.role !== "SUPPORT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const documentId = params.id

    // Get the document
    const document = await db.document.findUnique({
      where: { id: documentId },
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Generate a signed URL for download (valid for 1 hour)
    const downloadUrl = getSignedUrl(document.fileUrl, 3600)

    // Try to create activity record if the table exists
    try {
      await db.$executeRawUnsafe(
        `
        INSERT INTO DocumentActivity (id, action, documentId, userId, businessId, details, createdAt)
        VALUES (UUID(), 'DOWNLOAD', ?, ?, ?, 'Downloaded by admin', NOW())
      `,
        documentId,
        user.id,
        document.businessId,
      )
    } catch (activityError) {
      // If the table doesn't exist, just log the error but continue
      console.warn("Could not record document activity:", activityError)
    }

    return NextResponse.json({
      success: true,
      downloadUrl,
      documentName: document.name,
    })
  } catch (error) {
    console.error("Error generating download URL:", error)
    return NextResponse.json(
      {
        error: "Failed to generate download URL",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

