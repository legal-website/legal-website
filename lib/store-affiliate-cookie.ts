import { db } from "@/lib/db"

export async function storeAffiliateCookie(email: string, affiliateCode: string): Promise<void> {
  try {
    console.log(`Storing affiliate cookie for ${email}: ${affiliateCode}`)

    // Store the affiliate code in the system settings table
    await db.systemSettings.upsert({
      where: {
        key: `affiliate_cookie_${email}`,
      },
      update: {
        value: affiliateCode,
      },
      create: {
        key: `affiliate_cookie_${email}`,
        value: affiliateCode,
      },
    })

    console.log(`Successfully stored affiliate cookie for ${email}`)
  } catch (error) {
    console.error("Error storing affiliate cookie:", error)
    throw error
  }
}

