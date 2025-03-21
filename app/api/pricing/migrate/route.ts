import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    console.log("Running pricing table migration...")

    // Check if the table exists
    let tableExists = true
    try {
      await db.$queryRawUnsafe(`SELECT * FROM PricingSettings LIMIT 1`)
      console.log("PricingSettings table exists")
    } catch (error) {
      console.log("PricingSettings table does not exist, will create it")
      tableExists = false
    }

    // If table doesn't exist, create it
    if (!tableExists) {
      try {
        await db.$executeRawUnsafe(`
          CREATE TABLE \`PricingSettings\` (
            \`id\` INT NOT NULL AUTO_INCREMENT,
            \`key\` VARCHAR(255) NOT NULL,
            \`value\` LONGTEXT NOT NULL,
            \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
            \`updatedAt\` DATETIME(3) NOT NULL,
            PRIMARY KEY (\`id\`),
            UNIQUE INDEX \`PricingSettings_key_key\` (\`key\`)
          );
        `)
        console.log("PricingSettings table created successfully")
      } catch (createError) {
        console.error("Error creating PricingSettings table:", createError)
        return NextResponse.json(
          {
            error: "Failed to create PricingSettings table",
            details: createError instanceof Error ? createError.message : String(createError),
          },
          { status: 500 },
        )
      }
    }

    // Check if we need to add any missing columns
    try {
      // This is just a placeholder for future migrations if needed
      console.log("Checking for any needed column migrations...")
    } catch (error) {
      console.error("Error during column migration:", error)
    }

    return NextResponse.json({ success: true, message: "Migration completed successfully" })
  } catch (error) {
    console.error("Error during migration:", error)
    return NextResponse.json(
      {
        error: "Migration failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

