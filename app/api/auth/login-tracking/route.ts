import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { sendLoginNotificationEmail } from "@/lib/email"

export async function POST(req: NextRequest) {
  try {
    // Get the session
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Get the request data
    const data = await req.json()
    const { ipAddress, userAgent } = data

    // Get the user
    const user = await prisma.$queryRawUnsafe<any[]>(
      `
      SELECT id, email, name FROM User WHERE email = ? LIMIT 1
    `,
      session.user.email,
    )

    if (!user || user.length === 0) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    const userId = user[0].id

    // Get user settings
    const settings = await prisma.$queryRawUnsafe<any[]>(
      `
      SELECT * FROM UserSettings WHERE userId = ? LIMIT 1
    `,
      userId,
    )

    const loginNotificationsEnabled = settings.length > 0 ? settings[0].loginNotificationsEnabled : false

    // Parse user agent
    const browser = getBrowserInfo(userAgent)
    const os = getOSInfo(userAgent)
    const device = getDeviceInfo(userAgent)
    const location = "Unknown location"

    // Check if this is a new device/location
    const existingSessions = await prisma.$queryRawUnsafe<any[]>(
      `
      SELECT * FROM LoginSession 
      WHERE userId = ? 
      AND userAgent = ? 
      AND browser = ? 
      AND os = ? 
      LIMIT 1
    `,
      userId,
      userAgent,
      browser,
      os,
    )

    const isNewDevice = existingSessions.length === 0

    // Create or update login session
    if (existingSessions.length > 0) {
      await prisma.$executeRawUnsafe(
        `
        UPDATE LoginSession 
        SET lastActiveAt = NOW(), 
            ipAddress = ?, 
            location = ?, 
            isActive = true 
        WHERE id = ?
      `,
        ipAddress,
        location,
        existingSessions[0].id,
      )
    } else {
      // Generate a UUID for the session ID
      const sessionId = crypto.randomUUID()

      // This is a new device/location
      await prisma.$executeRawUnsafe(
        `
        INSERT INTO LoginSession 
        (id, userId, ipAddress, userAgent, browser, os, device, location, isActive, lastActiveAt, createdAt) 
        VALUES 
        (?, ?, ?, ?, ?, ?, ?, ?, true, NOW(), NOW())
      `,
        sessionId,
        userId,
        ipAddress,
        userAgent,
        browser,
        os,
        device,
        location,
      )

      // Send notification email if enabled
      if (loginNotificationsEnabled) {
        await sendLoginNotificationEmail({
          email: session.user.email,
          name: user[0].name || "User",
          ipAddress,
          browser,
          os,
          location,
          time: new Date().toISOString(),
        })
      }
    }

    return NextResponse.json({
      success: true,
      isNewDevice,
      notificationsEnabled: loginNotificationsEnabled,
    })
  } catch (error) {
    console.error("Error tracking login:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

// Helper functions to parse user agent
function getBrowserInfo(userAgent: string): string {
  if (userAgent.includes("Chrome")) return "Chrome"
  if (userAgent.includes("Firefox")) return "Firefox"
  if (userAgent.includes("Safari")) return "Safari"
  if (userAgent.includes("Edge")) return "Edge"
  if (userAgent.includes("MSIE") || userAgent.includes("Trident/")) return "Internet Explorer"
  return "Unknown Browser"
}

function getOSInfo(userAgent: string): string {
  if (userAgent.includes("Windows")) return "Windows"
  if (userAgent.includes("Mac")) return "MacOS"
  if (userAgent.includes("Linux")) return "Linux"
  if (userAgent.includes("Android")) return "Android"
  if (userAgent.includes("iPhone") || userAgent.includes("iPad")) return "iOS"
  return "Unknown OS"
}

function getDeviceInfo(userAgent: string): string {
  if (userAgent.includes("Mobile")) return "Mobile"
  if (userAgent.includes("Tablet")) return "Tablet"
  return "Desktop"
}

