import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  try {
    console.log("Starting database migration...")

    // Check if BankAccount table exists
    const tableExists = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_schema = DATABASE() AND table_name = 'BankAccount'
    `

    // If table doesn't exist, we don't need to do anything as Prisma will create it
    if (Array.isArray(tableExists) && tableExists[0].count === 0) {
      console.log("BankAccount table does not exist yet, skipping migration")
      return
    }

    // Check if the columns exist
    const columnsExist = await prisma.$queryRaw`
      SELECT 
        SUM(CASE WHEN COLUMN_NAME = 'swiftCode' THEN 1 ELSE 0 END) as swiftCode,
        SUM(CASE WHEN COLUMN_NAME = 'branchName' THEN 1 ELSE 0 END) as branchName,
        SUM(CASE WHEN COLUMN_NAME = 'branchCode' THEN 1 ELSE 0 END) as branchCode
      FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = 'BankAccount'
    `

    // Add missing columns if they don't exist
    if (Array.isArray(columnsExist) && columnsExist[0]) {
      const { swiftCode, branchName, branchCode } = columnsExist[0]

      if (!swiftCode) {
        console.log("Adding swiftCode column to BankAccount table")
        await prisma.$executeRaw`ALTER TABLE BankAccount ADD COLUMN swiftCode VARCHAR(191)`
      }

      if (!branchName) {
        console.log("Adding branchName column to BankAccount table")
        await prisma.$executeRaw`ALTER TABLE BankAccount ADD COLUMN branchName VARCHAR(191)`
      }

      if (!branchCode) {
        console.log("Adding branchCode column to BankAccount table")
        await prisma.$executeRaw`ALTER TABLE BankAccount ADD COLUMN branchCode VARCHAR(191)`
      }
    }

    console.log("Migration completed successfully")
  } catch (error) {
    console.error("Migration failed:", error)
  } finally {
    await prisma.$disconnect()
  }
}

main()

