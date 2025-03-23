import { db } from "@/lib/db"

export async function storeAffiliateCookie(email: string, affiliateCode: string) {
  try {
    console.log(`Storing affiliate code ${affiliateCode} for email ${email}`)

    // Check if a record already exists
    const existingRecord = await db.systemSettings.findFirst({
      where: {
        key: `affiliate_cookie_${email}`,
      },
    })

    if (existingRecord) {
      // Update existing record
      await db.systemSettings.update({
        where: {
          id: existingRecord.id,
        },
        data: {
          value: affiliateCode,
        },
      })
      console.log(`Updated existing affiliate record for ${email}`)
    } else {
      // Create new record
      await db.systemSettings.create({
        data: {
          key: `affiliate_cookie_${email}`,
          value: affiliateCode,
        },
      })
      console.log(`Created new affiliate record for ${email}`)
    }

    return true
  } catch (error) {
    console.error(`Error storing affiliate cookie for ${email}:`, error)
    return false
  }
}

