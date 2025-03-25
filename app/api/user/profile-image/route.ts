import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { uploadToCloudinary } from "@/lib/cloudinary"

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse the form data
    const formData = await request.formData()
    const file = formData.get("file") as File
    const userId = formData.get("userId") as string

    // Verify the user is updating their own profile
    if (session.user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized to update this profile" }, { status: 403 })
    }

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Upload the image to Cloudinary
    const imageUrl = await uploadToCloudinary(file, {
      folder: "profile-images",
      public_id: `user-${userId}`,
      overwrite: true,
    })

    // Update the user record in the database
    await db.user.update({
      where: { id: userId },
      data: { image: imageUrl },
    })

    return NextResponse.json({ success: true, imageUrl })
  } catch (error) {
    console.error("Error uploading profile image:", error)
    return NextResponse.json({ error: "Failed to upload profile image" }, { status: 500 })
  }
}

