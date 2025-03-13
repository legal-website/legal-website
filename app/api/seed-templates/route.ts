import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Sample templates data
    const templates = [
      {
        name: "LLC Formation|49.99|Business Formation",
        category: "template_master",
        type: "template",
        fileUrl: "https://res.cloudinary.com/demo/image/upload/sample.pdf",
        businessId: "system",
      },
      {
        name: "Employment Agreement|29.99|Contracts",
        category: "template_master",
        type: "template",
        fileUrl: "https://res.cloudinary.com/demo/image/upload/sample.pdf",
        businessId: "system",
      },
      {
        name: "Privacy Policy|0|Compliance",
        category: "template_master",
        type: "template",
        fileUrl: "https://res.cloudinary.com/demo/image/upload/sample.pdf",
        businessId: "system",
      },
    ];

    // Create templates in database
    const createdTemplates = await Promise.all(
      templates.map(template => db.document.create({ data: template }))
    );

    return NextResponse.json({ 
      message: "Templates seeded successfully", 
      count: createdTemplates.length 
    });
  } catch (error: any) {
    console.error("Error seeding templates:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET endpoint to check if templates exist
export async function GET() {
  try {
    const templates = await db.document.findMany({
      where: {
        category: "template_master",
        type: "template",
      },
    });

    return NextResponse.json({ 
      templates,
      count: templates.length
    });
  } catch (error: any) {
    console.error("Error checking templates:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}