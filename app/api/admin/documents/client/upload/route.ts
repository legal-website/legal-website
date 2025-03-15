import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { role: true },
    })

    if (adminUser?.role !== "ADMIN" && adminUser?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const name = formData.get("name") as string
    const category = formData.get("category") as string
    const userId = formData.get("userId") as string
    const file = formData.get("file") as File

    if (!name || !category || !userId || !file) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get user's business
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { business: true },
    })

    if (!user?.business) {
      return NextResponse.json({ error: "User has no business associated" }, { status: 400 })
    }

    // Upload file to storage (this is a placeholder - implement your actual file upload logic)
    // For example, you might use AWS S3, Google Cloud Storage, etc.
    const fileUrl = `https://example.com/files/${file.name}`

    // Create document in database - using only fields that exist in the schema
    const document = await prisma.document.create({
      data: {
        name,
        category,
        fileUrl,
        type: file.type,
        businessId: user.business.id,
      },
    })

    return NextResponse.json({
      success: true,
      document,
    })
  } catch (error) {
    console.error("Error uploading document:", error)
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 })
  }
}

