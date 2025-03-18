// app/api/admin/annual-reports/requirements/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { UserRole } from "@/lib/db/schema"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Get all requirements
    const requirements = await prisma.filingRequirement.findMany({
      orderBy: {
        title: 'asc',
      },
    })
    
    return NextResponse.json({ requirements })
  } catch (error) {
    console.error("Error fetching requirements:", error)
    return NextResponse.json({ error: "Failed to fetch requirements" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const data = await req.json()
    
    // Create a new requirement
    const requirement = await prisma.filingRequirement.create({
      data: {
        title: data.title,
        description: data.description,
        details: data.details,
        isActive: data.isActive,
      },
    })
    
    return NextResponse.json({ requirement })
  } catch (error) {
    console.error("Error creating requirement:", error)
    return NextResponse.json({ error: "Failed to create requirement" }, { status: 500 })
  }
}