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
    const deadlines = await prisma.annualReportDeadline.findMany({
      where: {
        userId: userId,
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