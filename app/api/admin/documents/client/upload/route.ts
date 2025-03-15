import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { uploadToCloudinary } from "@/lib/cloudinary"

// POST /api/admin/documents/client/upload
// Upload a new document for a client
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const admin = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
    })

    if (admin?.role !== "ADMIN" && admin?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse form data
    const formData = await req.formData()
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const category = formData.get("category") as string
    const userId = formData.get("userId") as string
    const file = formData.get("file") as File

    if (!name || !category || !file || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check file size (max 10MB per file)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Maximum size is 10MB" }, { status: 400 })
    }

    // Get user's business
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { business: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // If user doesn't have a business, create one
    let businessId = user.businessId
    if (!businessId) {
      const business = await prisma.business.create({
        data: {
          name: `${user.name || user.email}'s Business`,
          email: user.email,
        },
      })

      businessId = business.id

      // Update user with business ID
      await prisma.user.update({
        where: { id: user.id },
        data: { businessId: business.id },
      })
    }

    // Get file type
    const fileType = file.name.split(".").pop()?.toLowerCase() || "unknown"

    // Upload file to Cloudinary
    const fileUrl = await uploadToCloudinary(file)

    // Create document in database
    const document = await prisma.document.create({
      data: {
        name,
        description,
        category,
        type: fileType,
        size: file.size.toString(),
        fileUrl,
        businessId: businessId as string,
      },
    })

    // Create document sharing record
    await prisma.documentSharing.create({
      data: {
        documentId: document.id,
        sharedWithEmail: user.email,
        sharedById: admin.id,
      },
    })

    // Create activity record
    await prisma.documentActivity.create({
      data: {
        action: "UPLOAD",
        documentId: document.id,
        userId: admin.id,
        businessId: businessId as string,
        details: `Uploaded by admin for ${user.email}`,
      },
    })

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        name: document.name,
        description: document.description,
        category: document.category,
        fileUrl: document.fileUrl,
        fileType: document.type,
        fileSize: Number.parseInt(document.size),
        status: "Verified",
        uploadDate: document.createdAt.toISOString(),
        lastModified: document.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error("Error uploading document:", error)
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 })
  }
}

