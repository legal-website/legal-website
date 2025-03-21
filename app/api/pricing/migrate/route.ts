import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    console.log("Running pricing table migration...")

    // Check if the table exists
    let tableExists = true
    try {
      await db.$queryRawUnsafe(`SELECT * FROM PricingSettings LIMIT 1`)
    } catch (error) {
      tableExists = false
      console.log("PricingSettings table does not exist, will create it")
    }

    // If table doesn't exist, create it with the version column
    if (!tableExists) {
      try {
        await db.$executeRawUnsafe(`
          CREATE TABLE \`PricingSettings\` (
            \`id\` INT NOT NULL AUTO_INCREMENT,
            \`key\` VARCHAR(255) NOT NULL,
            \`value\` LONGTEXT NOT NULL,
            \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
            \`updatedAt\` DATETIME(3) NOT NULL,
            \`version\` INT NOT NULL DEFAULT 1,
            PRIMARY KEY (\`id\`),
            UNIQUE INDEX \`PricingSettings_key_key\` (\`key\`)
          );
        `)
        console.log("PricingSettings table created successfully with version column")

        return NextResponse.json({
          success: true,
          message: "PricingSettings table created successfully with version column",
        })
      } catch (createError) {
        console.error("Error creating PricingSettings table:", createError)
        return NextResponse.json(
          {
            success: false,
            error: "Failed to create PricingSettings table",
            details: createError instanceof Error ? createError.message : String(createError),
          },
          { status: 500 },
        )
      }
    }

    // If table exists, check if version column exists
    let versionColumnExists = true
    try {
      await db.$queryRawUnsafe(`SELECT version FROM PricingSettings LIMIT 1`)
    } catch (error) {
      versionColumnExists = false
      console.log("Version column does not exist, will add it")
    }

    // If version column doesn't exist, add it
    if (!versionColumnExists) {
      try {
        await db.$executeRawUnsafe(`
          ALTER TABLE PricingSettings 
          ADD COLUMN \`version\` INT NOT NULL DEFAULT 1
        `)
        console.log("Version column added successfully to PricingSettings table")

        return NextResponse.json({
          success: true,
          message: "Version column added successfully to PricingSettings table",
        })
      } catch (alterError) {
        console.error("Error adding version column:", alterError)
        return NextResponse.json(
          {
            success: false,
            error: "Failed to add version column",
            details: alterError instanceof Error ? alterError.message : String(alterError),
          },
          { status: 500 },
        )
      }
    }

    // If we get here, the table and column already exist
    return NextResponse.json({
      success: true,
      message: "PricingSettings table and version column already exist",
    })
  } catch (error) {
    console.error("Error in pricing migration:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Migration failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

