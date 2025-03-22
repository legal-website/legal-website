import prisma from "@/lib/prisma"

export async function storeAffiliateCookie(email: string, affiliateCode: string) {
  try {
    console.log(`Storing affiliate cookie for ${email}: ${affiliateCode}`)

    if (!email || !affiliateCode) {
      console.error("Missing email or affiliate code")
      return false
    }

    // Store the affiliate code in the database
    const result = await prisma.systemSettings.upsert({
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

    console.log("Stored affiliate cookie successfully:", result)
    return true
  } catch (error) {
    console.error("Error storing affiliate cookie:", error)
    return false
  }
}

