import { NextResponse, type NextRequest } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// GET - Fetch all templates (admin)
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all documents with type "template"
    const documents = await db.document.findMany({
      where: { type: "template" },
      orderBy: { createdAt: "desc" },
    })

    // Transform documents to template format
    const templates = documents.map((doc) => {
      // Parse metadata from name if available
      let price = 0
      let pricingTier = "Free"
      let usageCount = 0
      let status = "active"
      let displayName = doc.name

      try {
        // Try to extract metadata from name (format: "name|price|tier|count|status")
        const parts = doc.name.split("|")

        if (parts && parts.length > 1) {
          displayName = parts[0]
          price = Number.parseFloat(parts[1]) || 0
          pricingTier = parts[2] || "Free"
          usageCount = Number.parseInt(parts[3]) || 0
          status = parts[4] || "active"
        }
      } catch (e) {
        // If parsing fails, use defaults
        console.error("Error parsing template metadata:", e)
      }

      return {
        id: doc.id,
        name: displayName,
        category: doc.category,
        updatedAt: doc.updatedAt.toISOString(),
        status: status,
        usageCount: usageCount,
        price: price,
        pricingTier: pricingTier as any,
        description: doc.type,
        fileUrl: doc.fileUrl,
      }
    })

    return NextResponse.json({ templates })
  } catch (error: any) {
    console.error("Error fetching templates:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create a new template (admin)
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()

    // Validate required fields
    if (!data.name || !data.fileUrl || !data.businessId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Store metadata in name field (format: "name|price|tier|count|status")
    const metadataName = `${data.name}|${data.price || 0}|${data.pricingTier || "Free"}|0|active`

    // Create the template as a document
    const template = await db.document.create({
      data: {
        name: metadataName,
        category: data.category,
        businessId: data.businessId,
        fileUrl: data.fileUrl,
        type: "template",
      },
    })

    // Transform to template format for response
    const templateResponse = {
      id: template.id,
      name: data.name,
      category: data.category,
      updatedAt: template.updatedAt.toISOString(),
      status: "active",
      usageCount: 0,
      price: data.price || 0,
      pricingTier: data.pricingTier || "Free",
      description: data.description || "",
      fileUrl: template.fileUrl,
    }

    return NextResponse.json({ template: templateResponse }, { status: 201 })
  } catch (error: any) {
    console.error("Error creating template:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

