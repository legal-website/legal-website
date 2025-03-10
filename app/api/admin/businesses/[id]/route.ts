import { type NextRequest, NextResponse } from "next/server"
import { getBusinessById, updateBusiness } from "@/lib/business-service"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const business = await getBusinessById(params.id)

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 })
    }

    return NextResponse.json(business)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch business" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await req.json()
    const business = await updateBusiness(params.id, data)

    return NextResponse.json(business)
  } catch (error) {
    if ((error as any).code === "P2025") {
      return NextResponse.json({ error: "Business not found" }, { status: 404 })
    }

    return NextResponse.json({ error: "Failed to update business" }, { status: 500 })
  }
}

