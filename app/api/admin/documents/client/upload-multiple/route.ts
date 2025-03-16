import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { v2 as cloudinary } from "cloudinary"

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
    api_key: process.env.CLOUDINARY_API_KEY || "",
    api_secret: process.env.CLOUDINARY_API_SECRET || "",
  })
  

export async function POST(req: NextRequest) {
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

    // Parse form data
    const formData = await req.formData()
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const category = formData.get("category") as string
    const userIds = formData.getAll("userIds") as string[]
    const file = formData.get("file") as File

    if (!name || !category || !userIds.length || !file) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if all users exist and get their business IDs
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, businessId: true },
    })

    if (users.length !== userIds.length) {
      return NextResponse.json({ error: "One or more users not found" }, { status: 404 })
    }

    // Check if all users have a business
    const usersWithoutBusiness = users.filter((u: { id: string; businessId: string | null }) => !u.businessId)
    if (usersWithoutBusiness.length > 0) {
      return NextResponse.json(
        { error: `${usersWithoutBusiness.length} users don't have a business associated` },
        { status: 400 },
      )
    }

    // Get unique business IDs (in case multiple users belong to the same business)
    const businessIds = [...new Set(users.map((u: { id: string; businessId: string | null }) => u.businessId))]

    // Upload file to Cloudinary
    const buffer = Buffer.from(await file.arrayBuffer())
    const fileType = file.type

    // Upload to Cloudinary
    const uploadPromise = new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "auto",
            folder: "client-documents",
            public_id: `${Date.now()}-${file.name.replace(/\s+/g, "-")}`,
          },
          (error, result) => {
            if (error) {
              console.error("Cloudinary upload error:", error)
              reject(error)
            } else {
              resolve(result)
            }
          },
        )
        .end(buffer)
    })

    const uploadResult = (await uploadPromise) as any
    const fileUrl = uploadResult.secure_url

    console.log("File uploaded to Cloudinary:", fileUrl)

    // Create documents for each business
    const createdDocuments = await Promise.all(
      businessIds.map(async (businessId) => {
        return prisma.document.create({
          data: {
            name,
            category,
            businessId: businessId as string,
            fileUrl,
            type: fileType,
          },
        })
      }),
    )

    return NextResponse.json({
      success: true,
      message: `Document uploaded successfully for ${businessIds.length} businesses`,
      documents: createdDocuments,
    })
  } catch (error) {
    console.error("Error uploading document:", error)
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 })
  }
}

