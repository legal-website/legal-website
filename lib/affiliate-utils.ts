import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { v4 as uuidv4 } from "uuid"

export const AFFILIATE_COOKIE_NAME = "affiliate_code"

export async function getAffiliateCookie(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(AFFILIATE_COOKIE_NAME)?.value
}

export async function setAffiliateCookie(code: string): Promise<void> {
  const cookieStore = await cookies()
  // Set cookie for 30 days
  cookieStore.set(AFFILIATE_COOKIE_NAME, code, {
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  })
}

export async function recordAffiliateClick(code: string, ip?: string, userAgent?: string): Promise<void> {
  try {
    // Find the affiliate link
    const link = await db.affiliateLink.findFirst({
      where: { code },
    })

    if (!link) {
      console.error(`[AFFILIATE] Link with code ${code} not found`)
      return
    }

    // Record the click
    await db.affiliateClick.create({
      data: {
        id: uuidv4(),
        linkId: link.id,
        ip,
        userAgent,
      },
    })

    console.log(`[AFFILIATE] Click recorded for code ${code}`)
  } catch (error) {
    console.error("[AFFILIATE] Error recording click:", error)
  }
}

export async function recordAffiliateConversion(
  orderId: string,
  amount: number,
  affiliateCode?: string,
  customerEmail?: string,
): Promise<void> {
  try {
    if (!affiliateCode) {
      console.log(`[AFFILIATE] No affiliate code for order ${orderId}`)
      return
    }

    // Find the affiliate link
    const link = await db.affiliateLink.findFirst({
      where: { code: affiliateCode },
    })

    if (!link) {
      console.error(`[AFFILIATE] Link with code ${affiliateCode} not found`)
      return
    }

    // Get commission rate from settings
    const settings = (await db.affiliateSettings.findFirst()) || { commissionRate: 10 }
    const commissionRate =
      typeof settings.commissionRate === "number"
        ? settings.commissionRate / 100
        : Number(settings.commissionRate) / 100

    // Calculate commission
    const commission = amount * commissionRate

    // Create the conversion
    const conversion = await db.affiliateConversion.create({
      data: {
        id: uuidv4(),
        linkId: link.id,
        orderId,
        amount,
        commission,
        status: "PENDING",
        customerEmail,
        updatedAt: new Date(),
      },
    })

    console.log(`[AFFILIATE] Conversion recorded for order ${orderId}, commission: ${commission}`)
  } catch (error) {
    console.error("[AFFILIATE] Error recording conversion:", error)
  }
}

