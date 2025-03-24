import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { AffiliateConversionStatus, AffiliatePayoutStatus } from "@/lib/affiliate-types"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payoutData = await req.json()
    const {
      method,
      fullName,
      bankName,
      accountNumber,
      iban,
      swiftCode,
      branchAddress,
      paypalEmail,
      mobileNumber,
      cnic,
      additionalInfo,
      payoutId, // ID of a rejected payout that's being resubmitted
    } = payoutData

    if (!method || !fullName) {
      return NextResponse.json({ error: "Payment method and full name are required" }, { status: 400 })
    }

    // Method-specific validation
    if (method === "bank" && (!bankName || !accountNumber)) {
      return NextResponse.json({ error: "Bank name and account number are required" }, { status: 400 })
    } else if (method === "paypal" && !paypalEmail) {
      return NextResponse.json({ error: "PayPal email address is required" }, { status: 400 })
    } else if (["easypaisa", "jazzcash", "nayapay"].includes(method) && !mobileNumber) {
      return NextResponse.json({ error: "Mobile number is required" }, { status: 400 })
    }

    // Get affiliate link
    const affiliateLink = await db.affiliateLink.findUnique({
      where: { userId: session.user.id },
    })

    if (!affiliateLink) {
      return NextResponse.json({ error: "No affiliate account found" }, { status: 404 })
    }

    // If this is a resubmission of a rejected payout
    if (payoutId) {
      const rejectedPayout = await db.affiliatePayout.findUnique({
        where: {
          id: payoutId,
          userId: session.user.id,
          status: AffiliatePayoutStatus.REJECTED,
          processed: false,
        },
      })

      if (!rejectedPayout) {
        return NextResponse.json({ error: "Invalid rejected payout" }, { status: 400 })
      }

      // Create payment details JSON
      const paymentDetails = createPaymentDetailsObject(payoutData)

      // Update the rejected payout
      const updatedPayout = await db.affiliatePayout.update({
        where: { id: payoutId },
        data: {
          method,
          status: AffiliatePayoutStatus.PENDING,
          notes: JSON.stringify(paymentDetails),
          processed: true,
          updatedAt: new Date(),
        },
      })

      return NextResponse.json({ payout: updatedPayout })
    }

    // Regular new payout request
    // Calculate available balance
    const conversions = await db.affiliateConversion.findMany({
      where: {
        linkId: affiliateLink.id,
        status: AffiliateConversionStatus.APPROVED,
      },
    })

    const availableBalance = conversions.reduce((sum, c) => sum + Number(c.commission), 0)

    // Get minimum payout amount
    const settings = (await db.affiliateSettings.findFirst()) || { minPayoutAmount: 50 }

    if (availableBalance < Number(settings.minPayoutAmount)) {
      return NextResponse.json(
        {
          error: `Minimum payout amount is $${settings.minPayoutAmount}`,
        },
        { status: 400 },
      )
    }

    // Create payment details JSON
    const paymentDetails = createPaymentDetailsObject(payoutData)

    // Create payout request
    const payout = await db.affiliatePayout.create({
      data: {
        userId: session.user.id,
        amount: availableBalance,
        method,
        status: AffiliatePayoutStatus.PENDING,
        notes: JSON.stringify(paymentDetails),
        processed: false,
      },
    })

    // Update conversions to PAID status using raw SQL
    await db.$executeRaw`
      UPDATE affiliate_conversions 
      SET status = ${AffiliateConversionStatus.PAID}, updatedAt = NOW() 
      WHERE linkId = ${affiliateLink.id} AND status = ${AffiliateConversionStatus.APPROVED}
    `

    return NextResponse.json({ payout })
  } catch (error) {
    console.error("Error requesting payout:", error)
    return NextResponse.json({ error: "Failed to request payout" }, { status: 500 })
  }
}

// Helper function to create payment details object
function createPaymentDetailsObject(payoutData: any) {
  const {
    method,
    fullName,
    bankName,
    accountNumber,
    iban,
    swiftCode,
    branchAddress,
    paypalEmail,
    mobileNumber,
    cnic,
    additionalInfo,
  } = payoutData

  // Base payment details
  const paymentDetails: any = {
    method,
    fullName,
    additionalInfo: additionalInfo || null,
  }

  // Add method-specific details
  if (method === "bank") {
    paymentDetails.bankName = bankName
    paymentDetails.accountNumber = accountNumber
    paymentDetails.iban = iban || null
    paymentDetails.swiftCode = swiftCode || null
    paymentDetails.branchAddress = branchAddress || null
  } else if (method === "paypal") {
    paymentDetails.paypalEmail = paypalEmail
  } else if (["easypaisa", "jazzcash", "nayapay"].includes(method)) {
    paymentDetails.mobileNumber = mobileNumber
    paymentDetails.cnic = cnic || null
  }

  return paymentDetails
}

