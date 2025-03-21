import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    // Check if the PricingSettings table exists by trying to query it
    let tableExists = true
    try {
      await db.$queryRawUnsafe(`SELECT * FROM PricingSettings LIMIT 1`)
    } catch (error) {
      tableExists = false
    }

    if (tableExists) {
      return NextResponse.json({
        success: true,
        message: "PricingSettings table exists",
        exists: true,
      })
    }

    // If table doesn't exist, create it
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

      return NextResponse.json({
        success: true,
        message: "PricingSettings table created successfully",
        exists: false,
        created: true,
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
  } catch (error) {
    console.error("Error checking PricingSettings table:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check PricingSettings table",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

