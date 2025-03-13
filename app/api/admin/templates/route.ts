import { NextResponse, type NextRequest } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import { uploadToCloudinary } from "@/lib/cloudinary"

export async function GET(req: NextRequest) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get all templates
    const templates = await db.document.findMany({
      where: {
        type: "template_master",
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Process templates to extract metadata
    const processedTemplates = templates.map((template) => {
      // Extract metadata from name if available
      let name = template.name
      let price = 0
      let description = "Document template"
      let category = template.category

      // Check if name contains metadata (format: name|price|category|description)
      if (template.name.includes("|")) {
        const parts = template.name.split("|")
        if (parts.length >= 4) {
          name = parts[0]
          price = Number.parseFloat(parts[1]) || 0
          category = parts[2] || template.category
          description = parts[3] || description
        }
      }

      return {
        id: template.id,
        name,
        description,
        category,
        price,
        fileUrl: template.fileUrl,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
      }
    })

    return NextResponse.json({
      success: true,
      templates: processedTemplates,
    })
  } catch (error: any) {
    console.error("Error fetching templates:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An error occurred while fetching templates",
      },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const formData = await req.formData()
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const category = formData.get("category") as string
    const price = Number.parseFloat(formData.get("price") as string) || 0
    const file = formData.get("file") as File

    if (!name || !category || !file) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Upload file to Cloudinary
    const fileUrl = await uploadToCloudinary(file)

    if (!fileUrl) {
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
    }

    // Store metadata in the name field with format: name|price|category|description
    const metadataName = `${name}|${price}|${category}|${description}`

    // Create template in database
    const template = await db.document.create({
      data: {
        name: metadataName,
        category,
        fileUrl,
        type: "template_master",
        businessId: "system", // Use a special businessId for system templates
      },
    })

    return NextResponse.json({
      success: true,
      template: {
        id: template.id,
        name,
        description,
        category,
        price,
        fileUrl: template.fileUrl,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
      },
    })
  } catch (error: any) {
    console.error("Error creating template:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An error occurred while creating the template",
      },
      { status: 500 },
    )
  }
}

