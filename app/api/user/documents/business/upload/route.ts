import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { uploadToCloudinary } from "@/lib/cloudinary"

interface DocumentType {
  id: string
  name: string
  description?: string | null
  category: string
  type: string
  size: string
  fileUrl: string
  isPermanent: boolean
  businessId: string
  uploadedById: string
  createdAt: Date
  updatedAt: Date
}

// POST /api/user/documents/business/upload
// Upload a new business document
export async function POST(req: NextRequest) {
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

    // Parse form data
    const formData = await req.formData()
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const category = formData.get("category") as string
    const isPermanent = formData.get("isPermanent") === "true"
    const file = formData.get("file") as File

    if (!name || !category || !file) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check file size (max 10MB per file)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Maximum size is 10MB" }, { status: 400 })
    }

    // Check if adding this file would exceed storage limit
    if (storageInfo.totalStorageBytes + file.size > storageInfo.storageLimit) {
      return NextResponse.json({ error: "Storage limit exceeded" }, { status: 400 })
    }

    // Get file type
    const fileType = file.name.split(".").pop()?.toLowerCase() || "unknown"

    // Upload file to Cloudinary
    const fileUrl = await uploadToCloudinary(file)

    // Create document in database
    const document = (await prisma.document.create({
      data: {
        name,
        description,
        category,
        type: fileType,
        size: file.size.toString(),
        fileUrl,
        isPermanent,
        businessId,
        uploadedById: userId,
      },
    })) as unknown as DocumentType

    // Update storage usage
    await prisma.businessStorage.update({
      where: { id: storageInfo.id },
      data: {
        totalStorageBytes: storageInfo.totalStorageBytes + file.size,
      },
    })

    // Create activity record
    await prisma.documentActivity.create({
      data: {
        action: "UPLOAD",
        documentId: document.id,
        userId,
        businessId,
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
        isPermanent: document.isPermanent,
        createdAt: document.createdAt.toISOString(),
        updatedAt: document.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error("Error uploading document:", error)
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 })
  }
}

