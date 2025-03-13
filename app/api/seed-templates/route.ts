import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    // Check if user is admin
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if templates already exist
    const existingTemplates = await db.document.findMany({
      where: {
        category: "template_master",
        type: "template",
      },
    })

    if (existingTemplates.length > 0) {
      return NextResponse.json({
        message: `${existingTemplates.length} templates already exist`,
        templates: existingTemplates,
      })
    }

    // Create sample templates
    const templates = [
      {
        name: "LLC Formation|49.99|Business Formation|Complete LLC formation document package",
        category: "template_master",
        type: "template",
        fileUrl: "https://example.com/templates/llc-formation.pdf",
        businessId: "system",
      },
      {
        name: "Employment Agreement|29.99|Contracts|Standard employment agreement template",
        category: "template_master",
        type: "template",
        fileUrl: "https://example.com/templates/employment-agreement.pdf",
        businessId: "system",
      },
      {
        name: "Privacy Policy|0|Compliance|Website privacy policy template",
        category: "template_master",
        type: "template",
        fileUrl: "https://example.com/templates/privacy-policy.pdf",
        businessId: "system",
      },
      {
        name: "Non-Disclosure Agreement|19.99|Contracts|Confidentiality agreement for business",
        category: "template_master",
        type: "template",
        fileUrl: "https://example.com/templates/nda.pdf",
        businessId: "system",
      },
      {
        name: "Business Plan|39.99|Business Planning|Comprehensive business plan template",
        category: "template_master",
        type: "template",
        fileUrl: "https://example.com/templates/business-plan.pdf",
        businessId: "system",
      },
    ]

    // Insert templates into database
    const createdTemplates = await Promise.all(templates.map((template) => db.document.create({ data: template })))

    return NextResponse.json({
      message: `Created ${createdTemplates.length} templates`,
      templates: createdTemplates,
    })
  } catch (error: any) {
    console.error("Error seeding templates:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST() {
  // Same implementation as GET for simplicity
  return GET()
}

