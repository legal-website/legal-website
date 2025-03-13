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

    // Get all documents with category "template_master"
    const templates = await db.document.findMany({
      where: { category: "template_master" },
      orderBy: { createdAt: "desc" },
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

    // Create the template as a document with special category
    const template = await db.document.create({
      data: {
        name: data.name,
        category: "template_master",
        businessId: data.businessId,
        fileUrl: data.fileUrl,
        type: "template",
      },
    })

    return NextResponse.json({ template }, { status: 201 })
  } catch (error: any) {
    console.error("Error creating template:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

