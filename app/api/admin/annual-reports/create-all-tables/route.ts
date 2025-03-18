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

    const tables = [
      {
        name: "AnnualReportDeadline",
        createSql: `
          CREATE TABLE AnnualReportDeadline (
            id VARCHAR(191) NOT NULL,
            userId VARCHAR(191) NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            dueDate DATETIME(3) NOT NULL,
            fee DECIMAL(10,2) NOT NULL,
            lateFee DECIMAL(10,2),
            status VARCHAR(50) NOT NULL DEFAULT 'pending',
            createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
            updatedAt DATETIME(3) NOT NULL,
            
            PRIMARY KEY (id),
            INDEX AnnualReportDeadline_userId_idx (userId)
          )
        `,
      },
      {
        name: "AnnualReportFiling",
        createSql: `
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
        `,
      },
      {
        name: "FilingRequirement",
        createSql: `
          CREATE TABLE FilingRequirement (
            id VARCHAR(191) NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            details TEXT,
            isActive BOOLEAN NOT NULL DEFAULT true,
            createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
            updatedAt DATETIME(3) NOT NULL,
            
            PRIMARY KEY (id)
          )
        `,
      },
    ]

    const results: Record<string, any> = {}

    for (const table of tables) {
      try {
        // Check if table exists
        const tableCheck = await prisma.$queryRaw`
          SELECT TABLE_NAME 
          FROM information_schema.TABLES 
          WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ${table.name}
        `

        const tableExists = Array.isArray(tableCheck) && tableCheck.length > 0

        if (tableExists) {
          results[table.name] = {
            exists: true,
            created: false,
            message: `Table ${table.name} already exists`,
          }
        } else {
          // Create the table
          await prisma.$executeRaw(table.createSql)

          results[table.name] = {
            exists: false,
            created: true,
            message: `Table ${table.name} created successfully`,
          }
        }
      } catch (error) {
        console.error(`Error with table ${table.name}:`, error)
        results[table.name] = {
          exists: false,
          created: false,
          error: (error as Error).message,
        }
      }
    }

    return NextResponse.json({
      results,
      message: "Table creation completed",
    })
  } catch (error) {
    console.error("Error in create-all-tables route:", error)
    return NextResponse.json(
      {
        error: "Failed to create tables",
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}

