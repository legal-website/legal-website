import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { UserRole } from "@/lib/db/schema"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if AnnualReportDeadline table exists
    try {
      const tableCheck = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'AnnualReportDeadline'
        ) as table_exists
      `
      console.log("AnnualReportDeadline table check:", tableCheck)

      // If table exists, check its columns
      if ((tableCheck as any)[0]?.table_exists) {
        const columns = await prisma.$queryRaw`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_schema = 'public'
          AND table_name = 'AnnualReportDeadline'
        `

        return NextResponse.json({
          tableExists: true,
          columns,
          message: "Schema check completed",
        })
      } else {
        return NextResponse.json({
          tableExists: false,
          message: "AnnualReportDeadline table does not exist",
        })
      }
    } catch (error) {
      console.error("Error checking schema:", error)
      return NextResponse.json(
        {
          error: "Error checking schema",
          details: (error as Error).message,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in schema check:", error)
    return NextResponse.json(
      {
        error: "Failed to run schema check",
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}

