import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import type { PricingData } from "@/types/subscription"

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
      // ... other states
    },
    stateDiscounts: {
      "New Mexico": 40,
      Wyoming: 80,
      // ... other states
    },
    stateDescriptions: {
      Alabama: "Annual Report: $50 (10th April)",
      Alaska: "Annual Report: $100 (every 2 years on 2nd Jan)",
      // ... other states
    },
  }

  fs.writeFileSync(dataFilePath, JSON.stringify(defaultData, null, 2))
}

// GET handler to retrieve pricing data
export async function GET() {
  try {
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
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 })
    }

    // Write the updated data to the file
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating pricing data:", error)
    return NextResponse.json({ error: "Failed to update pricing data" }, { status: 500 })
  }
}

