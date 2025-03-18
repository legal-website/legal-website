import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma" // Use the default prisma client instead of db

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const userId = (session.user as any).id
    
    // Use the regular Prisma client methods instead of raw queries
    const filings = await prisma.annualReportFiling.findMany({
      where: {
        userId: userId,
      },
      include: {
        deadline: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    
    return NextResponse.json({ filings })
  } catch (error) {
    console.error("Error fetching filings:", error)
    return NextResponse.json({ error: "Failed to fetch filings" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const userId = (session.user as any).id
    const { deadlineId, receiptUrl, userNotes } = await req.json()
    
    // Use the regular Prisma client methods instead of raw queries
    const filing = await prisma.annualReportFiling.create({
      data: {
        deadlineId,
        userId,
        receiptUrl,
        userNotes,
        status: "pending_payment",
      },
    })
    
    return NextResponse.json({ filing })
  } catch (error) {
    console.error("Error creating filing:", error)
    return NextResponse.json({ error: "Failed to create filing" }, { status: 500 })
  }
}