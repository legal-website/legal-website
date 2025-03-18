// app/api/admin/annual-reports/deadlines/route.ts
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
    
    // Get all deadlines with user info
    const deadlines = await prisma.annualReportDeadline.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    })
    
    return NextResponse.json({ deadlines })
  } catch (error) {
    console.error("Error fetching deadlines:", error)
    return NextResponse.json({ error: "Failed to fetch deadlines" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const data = await req.json()
    
    // Create a new deadline
    const deadline = await prisma.annualReportDeadline.create({
      data: {
        userId: data.userId,
        title: data.title,
        description: data.description,
        dueDate: new Date(data.dueDate),
        fee: data.fee,
        lateFee: data.lateFee,
        status: data.status || "pending",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
    
    return NextResponse.json({ deadline })
  } catch (error) {
    console.error("Error creating deadline:", error)
    return NextResponse.json({ error: "Failed to create deadline" }, { status: 500 })
  }
}