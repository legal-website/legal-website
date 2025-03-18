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

    // Check if table exists
    const tableCheck = await prisma.$queryRaw`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'AnnualReportFiling'
    `

    const tableExists = Array.isArray(tableCheck) && tableCheck.length > 0

    if (tableExists) {
      return NextResponse.json({
        message: "AnnualReportFiling table already exists",
        tableExists: true,
      })
    }

    // Create the table
    try {
      await prisma.$executeRaw`
        CREATE TABLE AnnualReportFiling (
          id VARCHAR(191) NOT NULL,
          userId VARCHAR(191) NOT NULL,
          deadlineId VARCHAR(191) NOT NULL,
          receiptUrl TEXT,
          reportUrl TEXT,
          status VARCHAR(50) NOT NULL DEFAULT 'pending',
          userNotes TEXT,
          adminNotes TEXT,
          filedDate DATETIME(3),
          createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          updatedAt DATETIME(3) NOT NULL,
          
          PRIMARY KEY (id),
          INDEX AnnualReportFiling_userId_idx (userId),
          INDEX AnnualReportFiling_deadlineId_idx (deadlineId)
        )
      `

      return NextResponse.json({
        message: "AnnualReportFiling table created successfully",
        tableExists: false,
        tableCreated: true,
      })
    } catch (error) {
      console.error("Error creating filing table:", error)
      return NextResponse.json(
        {
          error: "Error creating filing table",
          details: (error as Error).message,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in create-filing-table route:", error)
    return NextResponse.json(
      {
        error: "Failed to create filing table",
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}

