import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

// Add these interfaces at the top of the file, after the imports
interface DocumentWithBusiness {
  id: string
  name: string
  description: string | null
  category: string
  fileUrl: string
  type: string
  size: string | null
  createdAt: Date
  updatedAt: Date
  business: {
    name: string | null
  } | null
}

interface DocumentSharing {
  documentId: string
  sharedWithEmail: string
  createdAt: Date
  sharedBy: {
    name: string | null
    email: string | null
  } | null
}

// GET /api/admin/documents/client
// Fetch all client documents for admin
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
    })

    if (user?.role !== "ADMIN" && user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all documents
    const documents = await prisma.document.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        business: {
          select: {
            name: true,
          },
        },
      },
    })

    // Get document sharing info
    const documentIds = documents.map((doc: DocumentWithBusiness) => doc.id)
    const documentSharing = await prisma.documentSharing.findMany({
      where: {
        documentId: { in: documentIds },
      },
      include: {
        sharedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    // Format documents
    const formattedDocuments = documents.map((doc: DocumentWithBusiness) => {
      // Get sharing info for this document
      const sharing = documentSharing.filter((s: DocumentSharing) => s.documentId === doc.id)

      return {
        id: doc.id,
        name: doc.name,
        description: doc.description || "",
        category: doc.category,
        fileUrl: doc.fileUrl,
        fileType: doc.type,
        fileSize: Number.parseInt(doc.size || "0"),
        status: "Verified", // Default status for now
        uploadDate: doc.createdAt.toISOString(),
        lastModified: doc.updatedAt.toISOString(),
        businessName: doc.business?.name || "Unknown Business",
        sharedWith: sharing.map((s: DocumentSharing) => ({
          email: s.sharedWithEmail,
          sharedAt: s.createdAt.toISOString(),
        })),
      }
    })

    return NextResponse.json({
      documents: formattedDocuments,
    })
  } catch (error) {
    console.error("Error fetching client documents:", error)
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
  }
}

