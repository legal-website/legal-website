import { type NextRequest, NextResponse } from "next/server"
import { getAllBusinesses, createBusiness } from "@/lib/business-service"

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    const result = await getAllBusinesses(page, limit)

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch businesses" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()

    if (!data.name) {
      return NextResponse.json({ error: "Business name is required" }, { status: 400 })
    }

    const business = await createBusiness(data)

    return NextResponse.json(business, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create business" }, { status: 500 })
  }
}

