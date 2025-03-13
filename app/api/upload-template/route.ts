import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { uploadToCloudinary } from "@/lib/cloudinary"

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the form data
    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Upload file to Cloudinary
    const fileUrl = await uploadToCloudinary(file)

    return NextResponse.json({ url: fileUrl })
  } catch (error: any) {
    console.error("Error uploading template:", error)
    return NextResponse.json({ error: "Failed to upload template", details: error.message }, { status: 500 })
  }
}

