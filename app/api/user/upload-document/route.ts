import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { v4 as uuidv4 } from "uuid"
import { uploadToCloudinary } from "@/lib/cloudinary"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File
    const fileType = formData.get("fileType") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!fileType) {
      return NextResponse.json({ error: "No file type provided" }, { status: 400 })
    }

    // Generate a unique filename
    const fileName = `${fileType}_${uuidv4()}`

    // Upload to Cloudinary using the existing implementation
    // We're passing the file directly to uploadToCloudinary
    const result = await uploadToCloudinary(file, {
      folder: "personal_details",
      public_id: fileName,
    })

    return NextResponse.json({
      fileUrl: result.secure_url,
      publicId: result.public_id,
    })
  } catch (error) {
    console.error("Error uploading document:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

