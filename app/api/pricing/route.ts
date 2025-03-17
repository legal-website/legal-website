import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import type { PricingData } from "@/context/pricing-context"

// Define the path to the pricing data file
const dataFilePath = path.join(process.cwd(), "data", "pricing.json")

// Ensure the data directory exists
const dataDir = path.join(process.cwd(), "data")
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// Initialize with default data if the file doesn't exist
if (!fs.existsSync(dataFilePath)) {
  const defaultData: PricingData = {
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

  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(defaultData, null, 2))
  } catch (error) {
    console.error("Error writing default pricing data:", error)
  }
}

// GET handler to retrieve pricing data
export async function GET() {
  try {
    if (!fs.existsSync(dataFilePath)) {
      return NextResponse.json({ error: "Pricing data file not found" }, { status: 404 })
    }

    const data = fs.readFileSync(dataFilePath, "utf8")
    return NextResponse.json(JSON.parse(data))
  } catch (error) {
    console.error("Error reading pricing data:", error)
    return NextResponse.json({ error: "Failed to retrieve pricing data" }, { status: 500 })
  }
}

// POST handler to update pricing data
export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Validate the data structure (basic validation)
    if (!data.plans || !Array.isArray(data.plans)) {
      return NextResponse.json({ error: "Invalid data format: plans array is required" }, { status: 400 })
    }

    if (!data.stateFilingFees || typeof data.stateFilingFees !== "object") {
      return NextResponse.json({ error: "Invalid data format: stateFilingFees object is required" }, { status: 400 })
    }

    // Ensure the data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }

    // Write the updated data to the file
    try {
      fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2))
    } catch (writeError) {
      console.error("Error writing to pricing data file:", writeError)
      return NextResponse.json(
        {
          error: "Failed to write pricing data to file",
          details: writeError instanceof Error ? writeError.message : String(writeError),
        },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating pricing data:", error)
    return NextResponse.json(
      {
        error: "Failed to update pricing data",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

