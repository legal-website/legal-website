import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

// Define interfaces for the types we need
interface Business {
  id: string
  name: string | null
}

interface Document {
  id: string
  name: string
  description: string | null
  category: string | null
  fileUrl: string
  type: string
  size: string
  isPermanent?: boolean
  createdAt: Date
  updatedAt: Date
  business: Business | null
}

interface SharedByUser {
  id: string
  name: string | null
  email: string | null
}

interface DocumentSharing {
  id: string
  documentId: string
  sharedWithEmail: string
  createdAt: Date
  document: Document
  sharedBy: SharedByUser | null
}

// GET /api/user/documents/shared
// Fetch all documents shared with the current user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userEmail = session.user.email

    if (!userEmail) {
      return NextResponse.json({ error: "User email not found" }, { status: 400 })
    }

    // Get documents shared with this user
    const documentSharing = await prisma.documentSharing.findMany({
      where: { sharedWithEmail: userEmail },
      include: {
        document: {
          include: {
            business: true,
          },
        },
        sharedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Format documents
    const formattedDocuments = documentSharing.map((sharing: DocumentSharing) => {
      const doc = sharing.document

      return {
        id: doc.id,
        name: doc.name,
        description: doc.description,
        category: doc.category,
        fileUrl: doc.fileUrl,
        fileType: doc.type,
        fileSize: Number.parseInt(doc.size),
        businessName: doc.business?.name || "Unknown Business",
        sharedBy: {
          name: sharing.sharedBy?.name || null,
          email: sharing.sharedBy?.email || null,
        },
        sharedAt: sharing.createdAt.toISOString(),
      }
    })

    return NextResponse.json({
      documents: formattedDocuments,
    })
  } catch (error) {
    console.error("Error fetching shared documents:", error)
    return NextResponse.json({ error: "Failed to fetch shared documents" }, { status: 500 })
  }
}

