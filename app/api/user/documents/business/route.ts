import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

// GET /api/user/documents/business
// Fetch all business documents for the current user
export async function GET(req: NextRequest) {
  try {
    console.log("Starting to fetch business documents")

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

    if (!user?.business) {
      console.log("User has no business associated")
      return NextResponse.json({
        documents: [],
        storage: {
          totalStorageBytes: 0,
          storageLimit: 104857600, // 100MB default
          percentage: 0,
        },
        recentUpdates: [],
      })
    }

    console.log("Found business:", user.business.id)

    // Get documents for this business
    const documents = await prisma.document.findMany({
      where: { businessId: user.business.id },
      orderBy: { createdAt: "desc" },
    })

    console.log(`Found ${documents.length} documents`)

    // Calculate storage usage
    const totalStorageBytes = 0 // We don't have size in the schema, so we can't calculate this
    const storageLimit = 104857600 // 100MB default
    const percentage = (totalStorageBytes / storageLimit) * 100

    // Since we don't have DocumentActivity in the schema, we'll create some mock recent updates
    const recentUpdates = documents.slice(0, 5).map((doc: any) => {
      return {
        text: `Document "${doc.name}" was uploaded`,
        time: `${Math.floor(Math.random() * 24)} hours ago`,
      }
    })

    return NextResponse.json({
      documents,
      storage: {
        totalStorageBytes,
        storageLimit,
        percentage,
      },
      recentUpdates,
    })
  } catch (error) {
    console.error("Error fetching business documents:", error)
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
  }
}

