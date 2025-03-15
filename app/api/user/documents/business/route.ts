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
  business?: { name: string | null } | null
}

interface DocumentSharing {
  id: string
  documentId: string
  sharedWithEmail: string
  createdAt: Date
}

interface DocumentActivity {
  id: string
  documentId: string | null
  userId: string | null
  businessId: string
  action: string
  details: string | null
  createdAt: Date
  user: { name: string | null } | null
  document: { name: string | null } | null
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

    // Get user's business
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { business: true },
    })

    if (!user || !user.business) {
      return NextResponse.json({ error: "No business found for this user" }, { status: 404 })
    }

    const businessId = user.business.id

    // Get documents
    const documents = await prisma.document.findMany({
      where: { businessId },
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
    const documentIds = documents.map((doc: Document) => doc.id)
    const documentSharing = await prisma.documentSharing.findMany({
      where: {
        documentId: { in: documentIds },
      },
    })

    // Get storage info
    const storage = await prisma.businessStorage.findFirst({
      where: { businessId },
    })

    // If no storage record exists, create one
    const storageInfo =
      storage ||
      (await prisma.businessStorage.create({
        data: {
          businessId,
          totalStorageBytes: 0,
          storageLimit: 104857600, // 100MB
        },
      }))

    // Get recent updates (last 5 document activities)
    const recentDocumentActivities = await prisma.documentActivity.findMany({
      where: { businessId },
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
      const userName = activity.user?.name || "Someone"

      switch (activity.action) {
        case "UPLOAD":
          text = `${userName} uploaded "${activity.document?.name}"`
          break
        case "DOWNLOAD":
          text = `${userName} downloaded "${activity.document?.name}"`
          break
        case "SHARE":
          text = `${userName} shared "${activity.document?.name}" with ${activity.details || "someone"}`
          break
        case "DELETE":
          text = `${userName} deleted a document`
          break
        default:
          text = `${userName} performed an action on "${activity.document?.name}"`
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
    const formattedDocuments = documents.map((doc: Document) => {
      // Get sharing info for this document
      const sharing = documentSharing.filter((s: DocumentSharing) => s.documentId === doc.id)

      return {
        id: doc.id,
        name: doc.name,
        description: doc.description,
        category: doc.category,
        fileUrl: doc.fileUrl,
        fileType: doc.type,
        fileSize: Number.parseInt(doc.size),
        isPermanent: doc.isPermanent || false,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
        businessName: doc.business?.name,
        sharedWith: sharing.map((s: DocumentSharing) => ({
          email: s.sharedWithEmail,
          sharedAt: s.createdAt.toISOString(),
        })),
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

