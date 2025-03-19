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
      AND TABLE_NAME = 'BeneficialOwner'
    `

    const tableExists = Array.isArray(tableCheck) && tableCheck.length > 0

    if (tableExists) {
      return NextResponse.json({
        message: "BeneficialOwner table already exists",
        tableExists: true,
      })
    }

    // Create the table
    try {
      await prisma.$executeRaw`
        CREATE TABLE BeneficialOwner (
          id VARCHAR(191) NOT NULL,
          userId VARCHAR(191) NOT NULL,
          name VARCHAR(255) NOT NULL,
          title VARCHAR(255) NOT NULL,
          ownershipPercentage DECIMAL(5,2) NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'pending',
          isDefault BOOLEAN NOT NULL DEFAULT false,
          dateAdded DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME NOT NULL,
          
          PRIMARY KEY (id),
          INDEX BeneficialOwner_userId_idx (userId),
          FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
        )
      `

      return NextResponse.json({
        message: "BeneficialOwner table created successfully",
        tableExists: false,
        tableCreated: true,
      })
    } catch (error) {
      console.error("Error creating BeneficialOwner table:", error)
      return NextResponse.json(
        {
          error: "Error creating BeneficialOwner table",
          details: (error as Error).message,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in create-table route:", error)
    return NextResponse.json(
      {
        error: "Failed to create BeneficialOwner table",
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}

