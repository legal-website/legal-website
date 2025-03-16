import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

// Define a type for the document from Prisma
interface PrismaDocument {
  id: string
  name: string
  description?: string | null
  category: string
  fileUrl: string
  type: string
  size?: string | null
  createdAt: Date
  updatedAt: Date
  businessId: string
  isPermanent: boolean
  business?: {
    name: string | null
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

    // Get URL parameters for pagination
    const url = new URL(req.url)
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const limit = Number.parseInt(url.searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    // Get total count for pagination
    const totalCount = await prisma.document.count()

    // Get documents with pagination
    const documents = await prisma.document.findMany({
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
      include: {
        business: {
          select: {
            name: true,
          },
        },
      },
    })

    // Format documents
    const formattedDocuments = documents.map((doc: PrismaDocument) => {
      // Try to parse the size as a number, or use a default value
      let fileSize = 0
      if (doc.size) {
        try {
          fileSize = Number.parseInt(doc.size, 10)
        } catch (e) {
          console.error("Error parsing file size:", e)
        }
      }

      return {
        id: doc.id,
        name: doc.name,
        description: doc.description || "",
        category: doc.category,
        fileUrl: doc.fileUrl,
        fileType: doc.type,
        type: doc.type,
        fileSize: fileSize,
        status: "Verified", // Default status for now
        uploadDate: doc.createdAt.toISOString(),
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
        businessName: doc.business?.name || "Unknown Business",
        businessId: doc.businessId,
        sharedWith: [], // Default since we don't have sharing info
        isPermanent: doc.isPermanent || false,
      }
    })

    return NextResponse.json({
      documents: formattedDocuments,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching client documents:", error)
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
  }
}

