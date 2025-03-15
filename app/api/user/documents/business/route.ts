import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

// Define interfaces for type safety
interface DocumentSharingWithDetails {
  documentId: string
  sharedWithEmail: string
  createdAt: Date
  document: {
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
  sharedBy: {
    id: string
    name: string | null
    email: string | null
  } | null
}

interface DocumentActivity {
  action: "UPLOAD" | "DOWNLOAD" | "SHARE" | "VERIFY" | string
  createdAt: Date
  user: {
    name: string | null
  } | null
  document: {
    name: string | null
  } | null
}

// GET /api/user/documents/business
// Fetch all business documents for the current user
export async function GET(req: NextRequest) {
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

    console.log("Fetching documents for user:", userEmail)

    // Get user's business
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { business: true },
    })

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

    console.log(`Found ${documentSharing.length} shared documents`)

    // Get document IDs
    const documentIds = documentSharing.map((sharing: DocumentSharingWithDetails) => sharing.documentId)

    // Get storage info if user has a business
    let storageInfo = {
      totalStorageBytes: 0,
      storageLimit: 104857600, // 100MB default
    }

    if (user?.business) {
      const storage = await prisma.businessStorage.findFirst({
        where: { businessId: user.business.id },
      })

      if (storage) {
        storageInfo = storage
      } else {
        // Create storage record if it doesn't exist
        const newStorage = await prisma.businessStorage.create({
          data: {
            businessId: user.business.id,
            totalStorageBytes: 0,
            storageLimit: 104857600, // 100MB
          },
        })
        storageInfo = newStorage
      }
    }

    // Get recent document activities
    const recentDocumentActivities = await prisma.documentActivity.findMany({
      where: {
        documentId: { in: documentIds },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        user: {
          select: {
            name: true,
          },
        },
        document: {
          select: {
            name: true,
          },
        },
      },
    })

    const recentUpdates = recentDocumentActivities.map((activity: DocumentActivity) => {
      let text = ""
      const userName = activity.user?.name || "Admin"

      switch (activity.action) {
        case "UPLOAD":
          text = `${userName} uploaded "${activity.document?.name || "a document"}"`
          break
        case "DOWNLOAD":
          text = `${userName} downloaded "${activity.document?.name || "a document"}"`
          break
        case "SHARE":
          text = `${userName} shared "${activity.document?.name || "a document"}" with you`
          break
        case "VERIFY":
          text = `${userName} verified "${activity.document?.name || "a document"}"`
          break
        default:
          text = `${userName} performed an action on "${activity.document?.name || "a document"}"`
      }

      // Format time
      const now = new Date()
      const activityTime = new Date(activity.createdAt)
      const diffMs = now.getTime() - activityTime.getTime()
      const diffMins = Math.round(diffMs / 60000)
      const diffHours = Math.round(diffMs / 3600000)
      const diffDays = Math.round(diffMs / 86400000)

      let time = ""
      if (diffMins < 60) {
        time = `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`
      } else if (diffHours < 24) {
        time = `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`
      } else {
        time = `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`
      }

      return { text, time }
    })

    // Format documents
    const formattedDocuments = documentSharing.map((sharing: DocumentSharingWithDetails) => {
      const doc = sharing.document

      return {
        id: doc.id,
        name: doc.name,
        description: doc.description,
        category: doc.category,
        fileUrl: doc.fileUrl,
        fileType: doc.type,
        fileSize: Number.parseInt(doc.size || "0"),
        uploadDate: doc.createdAt.toISOString(),
        lastModified: doc.updatedAt.toISOString(),
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
      storage: storageInfo,
      recentUpdates,
    })
  } catch (error) {
    console.error("Error fetching business documents:", error)
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
  }
}

