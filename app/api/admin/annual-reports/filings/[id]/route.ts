// app/api/admin/annual-reports/filings/[id]/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { UserRole } from "@/lib/db/schema"

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const data = await req.json()
    
    // Update the filing
    const filing = await prisma.annualReportFiling.update({
      where: {
        id: params.id,
      },
      data: {
        status: data.status,
        adminNotes: data.adminNotes,
        reportUrl: data.reportUrl,
        filedDate: data.filedDate ? new Date(data.filedDate) : undefined,
      },
    })
    
    return NextResponse.json({ filing })
  } catch (error) {
    console.error("Error updating filing:", error)
    return NextResponse.json({ error: "Failed to update filing" }, { status: 500 })
  }
}