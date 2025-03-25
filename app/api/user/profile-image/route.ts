import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { uploadToCloudinary } from "@/lib/cloudinary"

export async function POST(request: NextRequest) {
  try {
    console.log("Profile image upload request received")

    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      console.log("Unauthorized: No valid session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse the form data
    const formData = await request.formData()
    const file = formData.get("file") as File
    const userId = formData.get("userId") as string

    console.log(`Processing upload for user: ${userId}`)

    // Verify the user is updating their own profile
    if ((session.user as any).id !== userId) {
      console.log(`Unauthorized: Session user ${(session.user as any).id} doesn't match requested user ${userId}`)
      return NextResponse.json({ error: "Unauthorized to update this profile" }, { status: 403 })
    }

    if (!file) {
      console.log("No file provided in request")
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log(`File received: ${file.name}, ${file.type}, ${file.size} bytes`)

    // Upload the image to Cloudinary
    try {
      const result = await uploadToCloudinary(file, {
        folder: "profile-images",
        public_id: `user-${userId}`,
        overwrite: true,
      })

      console.log("Cloudinary upload successful:", result)

      // Get the image URL from the result
      let imageUrl
      if (typeof result === "string") {
        imageUrl = result
      } else if (result && typeof result === "object" && "secure_url" in result) {
        imageUrl = result.secure_url
      } else {
        throw new Error("Invalid response from Cloudinary")
      }

      // Update the user record in the database
      await db.user.update({
        where: { id: userId },
        data: { image: imageUrl },
      })

      console.log(`User profile updated with image: ${imageUrl}`)
      return NextResponse.json({ success: true, imageUrl })
    } catch (uploadError) {
      console.error("Cloudinary upload error:", uploadError)
      return NextResponse.json({ error: "Failed to upload image to cloud storage" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error in profile image upload API:", error)
    return NextResponse.json({ error: "Failed to process profile image upload" }, { status: 500 })
  }
}

