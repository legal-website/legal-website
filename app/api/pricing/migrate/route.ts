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
      console.log("PricingSettings table does not exist")
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
            \`version\` INT DEFAULT 1,
            PRIMARY KEY (\`id\`),
            UNIQUE INDEX \`PricingSettings_key_key\` (\`key\`)
          );
        `)
        console.log("PricingSettings table created successfully with version column")
        return NextResponse.json({
          success: true,
          message: "PricingSettings table created with version column",
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

    // Check if version column exists
    let versionExists = true
    try {
      await db.$queryRawUnsafe(`SELECT version FROM PricingSettings LIMIT 1`)
      console.log("Version column exists")
    } catch (error) {
      console.log("Version column does not exist, adding it...")
      versionExists = false
    }

    // Add version column if it doesn't exist
    if (!versionExists) {
      try {
        await db.$executeRawUnsafe(`
          ALTER TABLE PricingSettings 
          ADD COLUMN \`version\` INT DEFAULT 1
        `)
        console.log("Version column added successfully")

        // Update existing data to include version in the JSON
        const result = await db.$queryRawUnsafe(`
          SELECT id, value FROM PricingSettings WHERE \`key\` = 'pricing_data'
        `)

        if (result && Array.isArray(result) && result.length > 0) {
          for (const row of result) {
            try {
              const data = JSON.parse(row.value)
              if (!data._version) {
                data._version = 1
                await db.$executeRawUnsafe(
                  `UPDATE PricingSettings SET value = ?, version = 1, updatedAt = NOW() WHERE id = ?`,
                  JSON.stringify(data),
                  row.id,
                )
                console.log(`Updated row ${row.id} with version 1`)
              }
            } catch (e) {
              console.error(`Failed to update row ${row.id}:`, e)
            }
          }
        }

        return NextResponse.json({
          success: true,
          message: "Version column added and data updated",
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

    return NextResponse.json({
      success: true,
      message: "No migration needed, table and version column already exist",
    })
  } catch (error) {
    console.error("Error during migration:", error)
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

