import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { uploadFileToCloudinary } from "@/lib/cloudinary"

// POST /api/admin/documents/client/upload
// Upload a new document for a client
export async function POST(req: NextRequest) {
  try {
    console.log("Starting document upload process")

    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const admin = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
    })

    if (admin?.role !== "ADMIN" && admin?.role !== "SUPPORT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse form data
    const formData = await req.formData()
    const name = formData.get("name") as string
    const description = (formData.get("description") as string) || null
    const category = formData.get("category") as string
    const userId = formData.get("userId") as string
    const file = formData.get("file") as File

    console.log("Form data received:", { name, category, userId, fileSize: file?.size })

    if (!name || !category || !file || !userId) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: { name: !!name, category: !!category, file: !!file, userId: !!userId },
        },
        { status: 400 },
      )
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
      console.log("Creating new business for user:", user.email)

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

    console.log("Uploading file to Cloudinary:", file.name, file.type, file.size)

    // Upload file to Cloudinary with custom folder
    let fileUrl
    try {
      fileUrl = await uploadFileToCloudinary(file, {
        folder: "business_documents",
        resource_type: "auto",
      })

      if (!fileUrl) {
        throw new Error("No URL returned from Cloudinary")
      }

      console.log("Cloudinary upload successful, URL:", fileUrl)
    } catch (cloudinaryError) {
      console.error("Cloudinary upload error:", cloudinaryError)
      return NextResponse.json(
        {
          error: "Failed to upload file to storage",
          details: cloudinaryError instanceof Error ? cloudinaryError.message : "Unknown error",
        },
        { status: 500 },
      )
    }

    // Create document in database
    try {
      const document = await prisma.document.create({
        data: {
          name,
          category,
          type: fileType,
          fileUrl,
          businessId: businessId as string,
        },
      })

      console.log("Document created in database:", document.id)

      return NextResponse.json({
        success: true,
        document: {
          id: document.id,
          name: document.name,
          description: description,
          category: document.category,
          fileUrl: document.fileUrl,
          fileType: document.type,
          type: document.type,
          fileSize: file.size,
          uploadDate: document.createdAt.toISOString(),
          lastModified: document.updatedAt.toISOString(),
          businessId: document.businessId,
          createdAt: document.createdAt,
          updatedAt: document.updatedAt,
        },
      })
    } catch (dbError) {
      console.error("Database error creating document:", dbError)
      return NextResponse.json(
        {
          error: "Failed to save document to database",
          details: dbError instanceof Error ? dbError.message : "Unknown error",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error uploading document:", error)
    return NextResponse.json(
      {
        error: "Failed to upload document",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

