import { NextResponse } from "next/server"
import type { PricingData, PricingPlan } from "@/context/pricing-context"
import { db } from "@/lib/db"

// GET handler to retrieve pricing data
export async function GET() {
  try {
    console.log("Fetching pricing data...")

    // First, ensure the table exists
    let tableExists = true
    try {
      await db.$queryRawUnsafe(`SELECT * FROM PricingSettings LIMIT 1`)
    } catch (error) {
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
        console.log("PricingSettings table created successfully")
      } catch (createError) {
        console.error("Error creating PricingSettings table:", createError)
        // Continue with default data even if table creation fails
      }
    }

    // Try to get pricing data from the database using raw query
    try {
      const result = await db.$queryRawUnsafe(`
        SELECT value, version FROM PricingSettings WHERE \`key\` = 'pricing_data' LIMIT 1
      `)

      if (result && Array.isArray(result) && result.length > 0) {
        const pricingData = JSON.parse(result[0].value)
        // Add version from database to the data
        pricingData._version = result[0].version || 1

        // Ensure all boolean properties are properly typed
        if (pricingData.plans && Array.isArray(pricingData.plans)) {
          pricingData.plans = pricingData.plans.map((plan: any) => ({
            ...plan,
            isRecommended: Boolean(plan.isRecommended),
            includesPackage: plan.includesPackage || "",
            hasAssistBadge: Boolean(plan.hasAssistBadge),
          }))
        }

        console.log("Pricing data fetched successfully from database (version:", pricingData._version, ")")
        return NextResponse.json(pricingData, {
          headers: {
            "Cache-Control": "no-store, max-age=0, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        })
      }
    } catch (dbError) {
      console.error("Error fetching from database:", dbError)
      // Continue to create default data if database fails
    }

    // If no pricing data found or error occurred, create it with default data
    console.log("No pricing data found in database, creating default data")
    const defaultData = getDefaultPricingData()
    defaultData._version = 1

    try {
      const now = new Date().toISOString().slice(0, 19).replace("T", " ")
      await db.$executeRawUnsafe(
        `
        INSERT INTO PricingSettings (\`key\`, \`value\`, \`createdAt\`, \`updatedAt\`, \`version\`)
        VALUES ('pricing_data', ?, '${now}', '${now}', 1)
      `,
        JSON.stringify(defaultData),
      )

      console.log("Default pricing data saved to database")
    } catch (createError) {
      console.error("Error creating pricing data in database:", createError)
      // Continue even if saving fails
    }

    return NextResponse.json(defaultData, {
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error) {
    console.error("Error retrieving pricing data:", error)
    return NextResponse.json(
      {
        error: "Failed to retrieve pricing data",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

// POST handler to update pricing data
export async function POST(request: Request) {
  try {
    console.log("Received POST request to update pricing data")

    // Parse the request body
    let data: PricingData
    try {
      data = await request.json()
      console.log("Received data structure:", Object.keys(data))
      console.log("Number of plans:", data.plans?.length)
      console.log("Number of states:", Object.keys(data.stateFilingFees || {}).length)

      // Log the plans for debugging
      if (data.plans && Array.isArray(data.plans)) {
        console.log("Plans to save:", data.plans.map((plan: PricingPlan) => `${plan.name}: $${plan.price}`).join(", "))
      }
    } catch (parseError) {
      console.error("Error parsing request JSON:", parseError)
      return NextResponse.json(
        {
          error: "Invalid JSON in request body",
          details: parseError instanceof Error ? parseError.message : String(parseError),
        },
        { status: 400 },
      )
    }

    console.log("Validating data structure...")
    // Validate the data structure (basic validation)
    if (!data.plans || !Array.isArray(data.plans)) {
      console.error("Invalid data format: plans array is required")
      return NextResponse.json({ error: "Invalid data format: plans array is required" }, { status: 400 })
    }

    if (!data.stateFilingFees || typeof data.stateFilingFees !== "object") {
      console.error("Invalid data format: stateFilingFees object is required")
      return NextResponse.json({ error: "Invalid data format: stateFilingFees object is required" }, { status: 400 })
    }

    // Create a deep copy of the data to prevent reference issues
    const dataToSave = JSON.parse(JSON.stringify(data))

    // Ensure all boolean properties are properly typed
    if (dataToSave.plans && Array.isArray(dataToSave.plans)) {
      dataToSave.plans = dataToSave.plans.map((plan: any) => ({
        ...plan,
        isRecommended: Boolean(plan.isRecommended),
        includesPackage: plan.includesPackage || "",
        hasAssistBadge: Boolean(plan.hasAssistBadge),
      }))
    }

    // Ensure the table exists
    let tableExists = true
    try {
      await db.$queryRawUnsafe(`SELECT * FROM PricingSettings LIMIT 1`)
    } catch (error) {
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

    // Save the pricing data to the database
    console.log("Saving pricing data to database...")
    try {
      // Check if pricing data already exists and get current version
      const result = await db.$queryRawUnsafe(`
        SELECT id, version FROM PricingSettings WHERE \`key\` = 'pricing_data' LIMIT 1
      `)

      const now = new Date().toISOString().slice(0, 19).replace("T", " ")

      // Get the current version from the database or client
      let currentVersion = 1
      if (result && Array.isArray(result) && result.length > 0) {
        currentVersion = result[0].version || 1
      }

      // Check if client sent a version and it matches
      const clientVersion = data._version || 0
      console.log(`Client version: ${clientVersion}, Server version: ${currentVersion}`)

      // If client sent a version and it doesn't match, reject the update
      if (clientVersion > 0 && clientVersion !== currentVersion) {
        console.error(`Version mismatch: Client ${clientVersion}, Server ${currentVersion}`)
        return NextResponse.json(
          {
            error: "Version mismatch. Please refresh and try again.",
            currentVersion: currentVersion,
          },
          { status: 409 },
        )
      }

      // Increment version for the update
      const newVersion = currentVersion + 1
      dataToSave._version = newVersion

      const jsonData = JSON.stringify(dataToSave)

      console.log(
        "Data to save - Plans:",
        dataToSave.plans.map((plan: PricingPlan) => `${plan.name}: $${plan.price}`).join(", "),
      )
      console.log("Data to save - State count:", Object.keys(dataToSave.stateFilingFees).length)
      console.log(`Updating to version ${newVersion}`)

      if (result && Array.isArray(result) && result.length > 0) {
        // Update existing pricing data with new version
        await db.$executeRawUnsafe(
          `
          UPDATE PricingSettings 
          SET \`value\` = ?, \`updatedAt\` = '${now}', \`version\` = ?
          WHERE \`key\` = 'pricing_data'
        `,
          jsonData,
          newVersion,
        )
        console.log("Updated existing pricing data with ID:", result[0].id, "to version", newVersion)

        // Verify the update
        const verifyResult = await db.$queryRawUnsafe(`
          SELECT value, version FROM PricingSettings WHERE \`key\` = 'pricing_data' LIMIT 1
        `)

        if (verifyResult && Array.isArray(verifyResult) && verifyResult.length > 0) {
          const savedData = JSON.parse(verifyResult[0].value)
          console.log(
            "Verified saved data - Plans:",
            savedData.plans.map((plan: PricingPlan) => `${plan.name}: $${plan.price}`).join(", "),
          )
          console.log("Verified saved data - State count:", Object.keys(savedData.stateFilingFees).length)
          console.log("Verified saved data - Version:", verifyResult[0].version)
        }
      } else {
        // Create new pricing data with version 1
        await db.$executeRawUnsafe(
          `
          INSERT INTO PricingSettings (\`key\`, \`value\`, \`createdAt\`, \`updatedAt\`, \`version\`)
          VALUES ('pricing_data', ?, '${now}', '${now}', ?)
        `,
          jsonData,
          newVersion,
        )
        console.log("Created new pricing data with version", newVersion)
      }

      console.log("Pricing data updated successfully in database")

      // Add cache-busting headers to the response
      return NextResponse.json(
        {
          success: true,
          version: newVersion,
        },
        {
          headers: {
            "Cache-Control": "no-store, max-age=0, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        },
      )
    } catch (dbError) {
      console.error("Database error when saving pricing data:", dbError)
      return NextResponse.json(
        {
          error: "Database error when saving pricing data",
          details: dbError instanceof Error ? dbError.message : String(dbError),
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error processing pricing data update:", error)
    return NextResponse.json(
      {
        error: "Failed to update pricing data",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

// Default pricing data function
function getDefaultPricingData(): PricingData {
  return {
    plans: [
      {
        id: 1,
        name: "STARTER",
        price: 129,
        displayPrice: "$129",
        billingCycle: "one-time",
        description:
          "Includes the filing of Articles of Org to officially establish and Orizenly recognize your (LLC).",
        features: [
          "Company Formation",
          "Registered Agent",
          "Ein (Tax ID)",
          "Operating Agreement",
          "FinCEN BOI",
          "Standard Address",
          "Lifetime Support",
          "Company Alerts",
          "Dedicated Dashboard",
        ],
        isRecommended: false,
        includesPackage: "",
        hasAssistBadge: false,
      },
      {
        id: 2,
        name: "STANDARD",
        price: 199,
        displayPrice: "$199",
        billingCycle: "one-time",
        description: "Best for those planning to start and operate a business or side hustle.",
        features: [
          "Company Formation",
          "Registered Agent",
          "Ein (Tax ID)",
          "Operating Agreement",
          "FinCEN BOI",
          "Standard Address",
          "Business Bank Account",
          "Priority Support",
          "Company Alerts",
          "Dedicated Dashboard",
        ],
        isRecommended: true,
        includesPackage: "Basic",
        hasAssistBadge: false,
      },
      {
        id: 3,
        name: "Premium",
        price: 249,
        displayPrice: "$249",
        billingCycle: "one-time",
        description: "Best for those who want an experienced attorney to ensure they get everything right.",
        features: [
          "Company Formation",
          "Registered Agent",
          "Ein (Tax ID)",
          "Operating Agreement",
          "FinCEN BOI",
          "Unique Address",
          "Business Bank Account",
          "Priority Support",
          "Payment Gateway Setup",
          "Free Business Website",
          "Dedicated Dashboard",
          "Free Annual Report(1yr)",
          "Free .Com Domain",
        ],
        isRecommended: false,
        includesPackage: "Pro",
        hasAssistBadge: true,
      },
    ],
    stateFilingFees: {
      Alabama: 230,
      Alaska: 250,
      Arizona: 50,
      Arkansas: 45,
      California: 70,
      Colorado: 50,
      Connecticut: 120,
      Delaware: 90,
      Florida: 125,
      Georgia: 100,
      Hawaii: 50,
      Idaho: 100,
      Illinois: 150,
      Indiana: 95,
      Iowa: 50,
      Kansas: 160,
      Kentucky: 40,
      Louisiana: 100,
      Maine: 175,
      Maryland: 100,
      Massachusetts: 500,
      Michigan: 50,
      Minnesota: 135,
      Mississippi: 50,
      Missouri: 50,
      Montana: 70,
      Nebraska: 105,
      Nevada: 425,
      "New Hampshire": 100,
      "New Jersey": 125,
      "New Mexico": 50,
      "New York": 200,
      "North Carolina": 125,
      "North Dakota": 135,
      Ohio: 99,
      Oklahoma: 100,
      Oregon: 100,
      Pennsylvania: 125,
      "Rhode Island": 150,
      "South Carolina": 110,
      "South Dakota": 150,
      Tennessee: 300,
      Texas: 300,
      Utah: 54,
      Vermont: 125,
      Virginia: 100,
      Washington: 180,
      "West Virginia": 100,
      Wisconsin: 130,
      Wyoming: 100,
      "District of Columbia": 99,
    },
    stateDiscounts: {
      "New Mexico": 40,
      Wyoming: 80,
      Nevada: 325,
      Delaware: 70,
      "South Dakota": 120,
    },
    stateDescriptions: {
      Alabama: "Annual Report: $50 (10th April)",
      Alaska: "Annual Report: $100 (every 2 years on 2nd Jan)",
      Arizona: "Annual Report: $0 (No annual report required)",
      Arkansas: "Annual Report: $150 (1st May)",
      California: "Annual Report: $800 minimum tax + $20 filing fee (15th day of 4th month)",
      Colorado: "Annual Report: $10 (end of month of formation)",
      Connecticut: "Annual Report: $80 (anniversary of formation)",
      Delaware: "Annual Report: $300 + franchise tax (1st June)",
      Florida: "Annual Report: $138.75 (1st May)",
      Georgia: "Annual Report: $50 (1st April)",
      Hawaii: "Annual Report: $15 (end of quarter of formation)",
      Idaho: "Annual Report: $0 (end of month of formation)",
      Illinois: "Annual Report: $75 (first day of anniversary month)",
      Indiana: "Biennial Report: $32 (anniversary month of formation)",
      Iowa: "Biennial Report: $60 (1st April)",
      Kansas: "Annual Report: $55 (15th day of 4th month after fiscal year end)",
      Kentucky: "Annual Report: $15 (30th June)",
      Louisiana: "Annual Report: $35 (anniversary of formation)",
      Maine: "Annual Report: $85 (1st June)",
      Maryland: "Annual Report: $300 (15th April)",
      Massachusetts: "Annual Report: $500 (anniversary date)",
      Michigan: "Annual Report: $25 (15th Feb)",
      Minnesota: "Annual Report: $0 (31st Dec)",
      Mississippi: "Annual Report: $0 (15th April)",
      Missouri: "Annual Report: $0 (No annual report required)",
      Montana: "Annual Report: $20 (15th April)",
      Nebraska: "Biennial Report: $10 (1st April)",
      Nevada: "Annual List: $150 + $200 business license fee (last day of month of formation)",
      "New Hampshire": "Annual Report: $100 (1st April)",
      "New Jersey": "Annual Report: $75 (last day of anniversary month)",
      "New Mexico": "Annual Report: $0 (No annual report required)",
      "New York": "Biennial Statement: $9 (anniversary month)",
      "North Carolina": "Annual Report: $200 (15th April)",
      "North Dakota": "Annual Report: $50 (1st Nov)",
      Ohio: "Biennial Report: $0 (No report required)",
      Oklahoma: "Annual Report: $25 (anniversary date)",
      Oregon: "Annual Report: $100 (anniversary date)",
      Pennsylvania: "Decennial Report: $70 (every 10 years)",
      "Rhode Island": "Annual Report: $50 (1st Nov)",
      "South Carolina": "Annual Report: $0 (No annual report required)",
      "South Dakota": "Annual Report: $50 (1st anniversary month)",
      Tennessee: "Annual Report: $300 min (1st day of 4th month after fiscal year end)",
      Texas: "Annual Report: $0 (15th May)",
      Utah: "Annual Report: $18 (anniversary month)",
      Vermont: "Annual Report: $35 (anniversary quarter)",
      Virginia: "Annual Report: $50 (last day of month when formed)",
      Washington: "Annual Report: $60 (end of anniversary month)",
      "West Virginia": "Annual Report: $25 (1st July)",
      Wisconsin: "Annual Report: $25 (end of quarter of formation)",
      Wyoming: "Annual Report: $60 min (first day of anniversary month)",
      "District of Columbia": "Biennial Report: $300 (1st April)",
    },
  }
}

