import { NextResponse, type NextRequest } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// GET - Fetch a specific template
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const document = await db.document.findUnique({
      where: { id: params.id },
    })

    if (!document) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    // Parse metadata from name if available
    let name = document.name
    let price = 0
    let pricingTier = "Free"
    let usageCount = 0
    let status = "active"
    const description = ""

    try {
      // Try to extract metadata from name (format: "name|price|tier|count|status")
      const parts = document.name.split("|")
      if (parts.length > 1) {
        name = parts[0]
        price = Number.parseFloat(parts[1]) || 0
        pricingTier = parts[2] || "Free"
        usageCount = Number.parseInt(parts[3]) || 0
        status = parts[4] || "active"
      }
    } catch (e) {
      // If parsing fails, use defaults
      console.error("Error parsing template metadata:", e)
    }

    const template = {
      id: document.id,
      name: name,
      category: document.category,
      updatedAt: document.updatedAt.toISOString(),
      status: status,
      usageCount: usageCount,
      price: price,
      pricingTier: pricingTier,
      description: description,
      fileUrl: document.fileUrl,
    }

    return NextResponse.json({ template })
  } catch (error: any) {
    console.error("Error fetching template:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update a template
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()

    // Get existing document
    const existingDoc = await db.document.findUnique({
      where: { id: params.id },
    })

    if (!existingDoc) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    // Store metadata in name field (format: "name|price|tier|count|status")
    // Parse existing metadata to keep usage count
    let usageCount = 0
    try {
      const parts = existingDoc.name.split("|")
      if (parts.length > 1) {
        usageCount = Number.parseInt(parts[3]) || 0
      }
    } catch (e) {
      console.error("Error parsing existing template metadata:", e)
    }

    const metadataName = `${data.name}|${data.price || 0}|${data.pricingTier || "Free"}|${usageCount}|active`

    // Update the document
    const updatedDoc = await db.document.update({
      where: { id: params.id },
      data: {
        name: metadataName,
        category: data.category,
        fileUrl: data.fileUrl || existingDoc.fileUrl,
      },
    })

    // Transform to template format for response
    const template = {
      id: updatedDoc.id,
      name: data.name,
      category: data.category,
      updatedAt: updatedDoc.updatedAt.toISOString(),
      status: "active",
      usageCount: usageCount,
      price: data.price || 0,
      pricingTier: data.pricingTier || "Free",
      description: data.description || "",
      fileUrl: updatedDoc.fileUrl,
    }

    return NextResponse.json({ template })
  } catch (error: any) {
    console.error("Error updating template:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete a template
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete the document
    await db.document.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting template:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

