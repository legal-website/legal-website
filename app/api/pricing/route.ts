import { NextResponse } from "next/server"
import type { PricingData } from "@/context/pricing-context"
import { db } from "@/lib/db"

// Define the Plan interface
interface Plan {
  id: number
  name: string
  price: number
  displayPrice: string
  billingCycle: string
  description: string
  features: string[]
  isRecommended?: boolean
  includesPackage?: string
  hasAssistBadge?: boolean
}

// GET handler to retrieve pricing data
export async function GET(request: Request) {
  try {
    // Add a unique identifier to the request to bypass any caching
    const url = new URL(request.url)
    const noCache = url.searchParams.get("noCache") || Date.now().toString()

    console.log(`Fetching pricing data... (noCache: ${noCache})`)

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
            \`version\` INT NOT NULL DEFAULT 1,
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
        const version = result[0].version || 1

        console.log(`Pricing data fetched successfully from database (version: ${version})`)
        console.log("Plans:", pricingData.plans?.map((p: Plan) => `${p.name}: $${p.price}`).join(", "))
        console.log("State count:", Object.keys(pricingData.stateFilingFees || {}).length)

        // Add version to the response for tracking
        const responseData = {
          ...pricingData,
          _version: version,
        }

        return NextResponse.json(responseData, {
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

      // Add version to the response
      const responseData = {
        ...defaultData,
        _version: 1,
      }

      return NextResponse.json(responseData, {
        headers: {
          "Cache-Control": "no-store, max-age=0, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })
    } catch (createError) {
      console.error("Error creating pricing data in database:", createError)
      // Continue even if saving fails

      // Add version to the response
      const responseData = {
        ...defaultData,
        _version: 0, // Indicate this is not saved in DB
      }

      return NextResponse.json(responseData, {
        headers: {
          "Cache-Control": "no-store, max-age=0, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })
    }
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
    let data
    let version = 0
    try {
      data = await request.json()
      // Extract version if provided
      if (data._version) {
        version = data._version
        delete data._version // Remove from data before saving
      }

      console.log(`Received data structure (version: ${version}):`, Object.keys(data))
      console.log("Number of plans:", data.plans?.length)
      console.log("Plans:", data.plans?.map((p: Plan) => `${p.name}: $${p.price}`).join(", "))
      console.log("Number of states:", Object.keys(data.stateFilingFees || {}).length)

      // Log features for each plan to debug
      if (data.plans && Array.isArray(data.plans)) {
        data.plans.forEach((plan: Plan) => {
          console.log(`${plan.name} features (${plan.features?.length || 0}):`, plan.features?.join(", ") || "None")
        })
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
            \`version\` INT NOT NULL DEFAULT 1,
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
      const jsonData = JSON.stringify(data)

      console.log("Data to save - Plans:", data.plans.map((p: Plan) => `${p.name}: $${p.price}`).join(", "))
      console.log("Data to save - State count:", Object.keys(data.stateFilingFees).length)

      if (result && Array.isArray(result) && result.length > 0) {
        // Get current version and increment
        const currentVersion = result[0].version || 1
        const newVersion = currentVersion + 1

        console.log(`Updating pricing data from version ${currentVersion} to ${newVersion}`)

        // Update existing pricing data with incremented version
        await db.$executeRawUnsafe(
          `
          UPDATE PricingSettings 
          SET \`value\` = ?, \`updatedAt\` = '${now}', \`version\` = ${newVersion}
          WHERE \`key\` = 'pricing_data'
        `,
          jsonData,
        )
        console.log(`Updated existing pricing data with ID: ${result[0].id}, new version: ${newVersion}`)

        // Verify the update
        const verifyResult = await db.$queryRawUnsafe(`
          SELECT value, version FROM PricingSettings WHERE \`key\` = 'pricing_data' LIMIT 1
        `)

        if (verifyResult && Array.isArray(verifyResult) && verifyResult.length > 0) {
          const savedData = JSON.parse(verifyResult[0].value)
          const savedVersion = verifyResult[0].version

          console.log(
            `Verified saved data (version: ${savedVersion}) - Plans:`,
            savedData.plans.map((p: Plan) => `${p.name}: $${p.price}`).join(", "),
          )
          console.log("Verified saved data - State count:", Object.keys(savedData.stateFilingFees).length)

          // Return the new version with the response
          return NextResponse.json(
            {
              success: true,
              version: savedVersion,
            },
            {
              headers: {
                "Cache-Control": "no-store, max-age=0, must-revalidate",
                Pragma: "no-cache",
                Expires: "0",
              },
            },
          )
        }
      } else {
        // Create new pricing data
        await db.$executeRawUnsafe(
          `
          INSERT INTO PricingSettings (\`key\`, \`value\`, \`createdAt\`, \`updatedAt\`, \`version\`)
          VALUES ('pricing_data', ?, '${now}', '${now}', 1)
        `,
          jsonData,
        )
        console.log("Created new pricing data with version 1")

        // Return the new version with the response
        return NextResponse.json(
          {
            success: true,
            version: 1,
          },
          {
            headers: {
              "Cache-Control": "no-store, max-age=0, must-revalidate",
              Pragma: "no-cache",
              Expires: "0",
            },
          },
        )
      }

      // If we get here, something went wrong with verification
      console.log("Warning: Could not verify saved data, but no error occurred")
      return NextResponse.json(
        {
          success: true,
          warning: "Could not verify saved data",
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

