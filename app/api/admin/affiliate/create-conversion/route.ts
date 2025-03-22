import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { v4 as uuidv4 } from "uuid"
import { type AffiliateLinkWithCommission, AffiliateConversionStatus } from "@/lib/affiliate-types"

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { linkId, orderId, amount } = body

    if (!linkId || !orderId || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if the affiliate_conversions table exists
    const tableCheck = await db.$queryRaw`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = DATABASE()
        AND table_name = 'affiliate_conversions'
      ) as exists;
    `

    const tableExists = (tableCheck as any)[0].exists === 1

    if (!tableExists) {
      return NextResponse.json(
        {
          error: "The affiliate_conversions table does not exist",
          solution: "Please call /api/admin/affiliate/create-tables first",
        },
        { status: 400 },
      )
    }

    // Get the link and cast it to our custom type
    const link = (await db.affiliateLink.findUnique({
      where: { id: linkId },
    })) as unknown as AffiliateLinkWithCommission

    if (!link) {
      return NextResponse.json({ error: "Affiliate link not found" }, { status: 404 })
    }

    // Use a default commission rate if not available in the model
    const commissionRate = link.commission
      ? typeof link.commission === "number"
        ? link.commission
        : Number.parseFloat(link.commission.toString())
      : 0.1

    // Calculate commission
    const commissionAmount = Number.parseFloat(amount) * commissionRate

    // Create the conversion
    const conversion = await db.affiliateConversion.create({
      data: {
        id: uuidv4(),
        linkId,
        orderId,
        amount: Number.parseFloat(amount),
        commission: commissionAmount,
        status: AffiliateConversionStatus.PENDING,
        updatedAt: new Date(),
      },
    })

    console.log("[MANUAL_CONVERSION_CREATED]", conversion)

    return NextResponse.json({
      success: true,
      conversion,
    })
  } catch (error) {
    console.error("[MANUAL_CONVERSION_ERROR]", error)
    return NextResponse.json({ error: "Failed to create conversion", details: error }, { status: 500 })
  }
}

