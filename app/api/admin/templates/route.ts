import { NextResponse, type NextRequest } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { uploadToCloudinary } from "@/lib/cloudinary"

// POST - Create a new template
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const user = session.user as any
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const formData = await req.formData()

    const name = formData.get("name") as string
    const category = formData.get("category") as string
    const price = Number.parseFloat(formData.get("price") as string)
    const file = formData.get("file") as File
    const thumbnail = (formData.get("thumbnail") as File) || null

    if (!name || !category || isNaN(price) || !file) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Upload file to Cloudinary
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const fileUrl = await uploadToCloudinary(fileBuffer, file.name)

    // Upload thumbnail if provided
    let thumbnailUrl = null
    if (thumbnail) {
      const thumbnailBuffer = Buffer.from(await thumbnail.arrayBuffer())
      thumbnailUrl = await uploadToCloudinary(thumbnailBuffer, thumbnail.name)
    }

    // Store description in the name field with other metadata
    // Format: name|price|category|description
    const metadataName = `${name}|${price}|${category}|${formData.get("description") || ""}`

    // Create template in database as a Document with category "template_master"
    const template = await db.document.create({
      data: {
        name: metadataName, // Store metadata in name
        category: "template_master", // Important: This identifies it as a master template
        type: "template",
        fileUrl: fileUrl,
        businessId: "system", // Use a special ID for system templates
      },
    })

    // Parse the metadata back for the response
    const parts = template.name.split("|")
    const displayName = parts[0]
    const templatePrice = Number.parseFloat(parts[1]) || 0
    const templateCategory = parts[2] || "Uncategorized"
    const description = parts[3] || ""

    return NextResponse.json({
      template: {
        id: template.id,
        name: displayName,
        category: templateCategory,
        price: templatePrice,
        description: description,
        fileUrl: template.fileUrl,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
      },
    })
  } catch (error: any) {
    console.error("Error creating template:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET - Fetch all templates
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const user = session.user as any
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch all templates
    const templates = await db.document.findMany({
      where: {
        category: "template_master",
        type: "template",
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Format templates for display
    const formattedTemplates = templates.map((template) => {
      // Parse metadata from name
      let displayName = template.name
      let price = 0
      let category = "Uncategorized"
      let description = ""

      try {
        const parts = template.name.split("|")
        if (parts.length > 1) {
          displayName = parts[0]
          price = Number.parseFloat(parts[1]) || 0
          category = parts[2] || "Uncategorized"
          description = parts[3] || ""
        }
      } catch (e) {
        console.error("Error parsing template name:", e)
      }

      return {
        id: template.id,
        name: displayName,
        description: description,
        category: category,
        price: price,
        fileUrl: template.fileUrl,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
      }
    })

    return NextResponse.json({ templates: formattedTemplates })
  } catch (error: any) {
    console.error("Error fetching templates:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

