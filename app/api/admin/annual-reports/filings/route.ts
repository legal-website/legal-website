// app/api/admin/annual-reports/filings/route.ts
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
    
    // Get all filings with user and deadline info
    const filings = await prisma.annualReportFiling.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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