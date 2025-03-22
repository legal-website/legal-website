import { cookies } from "next/headers"
import prisma from "@/lib/prisma"

export async function storeAffiliateCookie(email: string, code: string) {
  try {
    console.log(`[AFFILIATE] Storing affiliate cookie for ${email}: ${code}`)

    // Store in database
    await prisma.systemSettings.upsert({
      where: { key: `affiliate_cookie_${email}` },
      update: { value: code },
      create: {
        key: `affiliate_cookie_${email}`,
        value: code,
        type: "string",
      },
    })

    // Also set/refresh the cookie
    const cookieStore = await cookies()
    cookieStore.set({
      name: "affiliate",
      value: code,
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    })

    console.log(`[AFFILIATE] Successfully stored affiliate cookie for ${email}`)
    return true
  } catch (error) {
    console.error(`[AFFILIATE] Error storing affiliate cookie for ${email}:`, error)
    return false
  }
}

