import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("Starting annual reports models migration...")

  try {
    // Check if the models already exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('AnnualReportDeadline', 'AnnualReportFiling', 'FilingRequirement')
    `

    console.log("Existing tables:", tables)

    // If tables don't exist, create them
    if (Array.isArray(tables) && tables.length < 3) {
      console.log("Creating annual reports models...")

      // Create the models using Prisma's schema push
      await prisma.$executeRaw`
        -- Create AnnualReportDeadline table if it doesn't exist
        CREATE TABLE IF NOT EXISTS "AnnualReportDeadline" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "description" TEXT,
          "dueDate" TIMESTAMP(3) NOT NULL,
          "fee" DECIMAL(10,2) NOT NULL,
          "lateFee" DECIMAL(10,2),
          "status" TEXT NOT NULL DEFAULT 'pending',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          
          CONSTRAINT "AnnualReportDeadline_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "AnnualReportDeadline_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
        
        -- Create AnnualReportFiling table if it doesn't exist
        CREATE TABLE IF NOT EXISTS "AnnualReportFiling" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "deadlineId" TEXT NOT NULL,
          "receiptUrl" TEXT,
          "reportUrl" TEXT,
          "status" TEXT NOT NULL DEFAULT 'pending',
          "userNotes" TEXT,
          "adminNotes" TEXT,
          "filedDate" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          
          CONSTRAINT "AnnualReportFiling_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "AnnualReportFiling_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "AnnualReportFiling_deadlineId_fkey" FOREIGN KEY ("deadlineId") REFERENCES "AnnualReportDeadline"("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
        
        -- Create FilingRequirement table if it doesn't exist
        CREATE TABLE IF NOT EXISTS "FilingRequirement" (
          "id" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "description" TEXT NOT NULL,
          "details" TEXT,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          
          CONSTRAINT "FilingRequirement_pkey" PRIMARY KEY ("id")
        );
      `

      console.log("Annual reports models created successfully")
    } else {
      console.log("Annual reports models already exist")
    }

    console.log("Migration completed successfully")
  } catch (error) {
    console.error("Migration failed:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .then(() => console.log("Migration script completed"))
  .catch((e) => {
    console.error("Migration script failed:", e)
    process.exit(1)
  })

