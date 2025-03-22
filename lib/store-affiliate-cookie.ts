import prisma from "@/lib/prisma"

export async function storeAffiliateCookie(email: string, affiliateCode: string) {
  try {
    console.log(`Storing affiliate cookie for ${email}: ${affiliateCode}`)

    // Store the affiliate code in the database
    await prisma.systemSettings.upsert({
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

    return true
  } catch (error) {
    console.error("Error storing affiliate cookie:", error)
    return false
  }
}

