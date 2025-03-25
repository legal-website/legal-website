import { type NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { db } from "@/lib/db"

// Define interfaces for our database models
interface User {
  id: string
  email: string
  name?: string | null
  settings?: UserSettings | null
}

interface UserSettings {
  loginNotificationsEnabled?: boolean
}

interface LoginSession {
  id: string
  userId: string
  ipAddress?: string | null
  userAgent: string
  browser?: string | null
  os?: string | null
  device?: string | null
  location?: string | null
  isActive: boolean
  lastActiveAt: Date
}

// Interface for login notification email
interface LoginNotificationEmailData {
  email: string
  name: string
  ipAddress: string
  browser: string
  os: string
  location: string
  time: string
}

// Simple function to send login notification email
async function sendLoginNotificationEmail(data: LoginNotificationEmailData) {
  try {
    // Implementation would depend on your email sending function
    console.log("Would send login notification email to:", data.email, "with data:", data)
    // You would call your actual email sending function here
    return { success: true }
  } catch (error) {
    console.error("Error sending login notification:", error)
    return { success: false, error }
  }
}

export async function trackLoginMiddleware(req: NextRequest) {
  try {
    // Only process on successful login
    const token = await getToken({ req })
    if (!token?.email) {
      return NextResponse.next()
    }

    // First, get all users to find the one with matching email
    // This is a workaround for the type constraint that only allows querying by id
    const users = await db.$queryRaw<User[]>`
      SELECT id, email, name FROM User WHERE email = ${token.email} LIMIT 1
    `

    const user = users.length > 0 ? users[0] : null

    if (!user) {
      return NextResponse.next()
    }

    // Get user settings
    const settingsResults = await db.$queryRaw<UserSettings[]>`
      SELECT loginNotificationsEnabled FROM UserSettings WHERE userId = ${user.id} LIMIT 1
    `

    const userSettings = settingsResults.length > 0 ? settingsResults[0] : null

    // Get IP address
    const ipAddress = req.headers.get("x-forwarded-for") || "Unknown"

    // Get user agent
    const userAgent = req.headers.get("user-agent") || "Unknown"

    // Parse user agent to get browser, OS, etc.
    const browser = getBrowserInfo(userAgent)
    const os = getOSInfo(userAgent)
    const device = getDeviceInfo(userAgent)

    // Get location from IP (simplified)
    const location = "Unknown location"

    // Check if this is a new device/location
    const existingSessions = await db.$queryRaw<LoginSession[]>`
      SELECT * FROM LoginSession 
      WHERE userId = ${user.id} 
      AND userAgent = ${userAgent} 
      AND browser = ${browser} 
      AND os = ${os}
      LIMIT 1
    `

    const existingSession = existingSessions.length > 0 ? existingSessions[0] : null

    // Create or update login session
    if (existingSession) {
      await db.$executeRaw`
        UPDATE LoginSession 
        SET lastActiveAt = NOW(), 
            ipAddress = ${ipAddress}, 
            location = ${location}, 
            isActive = true 
        WHERE id = ${existingSession.id}
      `
    } else {
      // This is a new device/location
      await db.$executeRaw`
        INSERT INTO LoginSession 
        (id, userId, ipAddress, userAgent, browser, os, device, location, isActive, lastActiveAt, createdAt) 
        VALUES 
        (UUID(), ${user.id}, ${ipAddress}, ${userAgent}, ${browser}, ${os}, ${device}, ${location}, true, NOW(), NOW())
      `

      // Send notification email if enabled
      if (userSettings?.loginNotificationsEnabled) {
        await sendLoginNotificationEmail({
          email: user.email,
          name: user.name || "User",
          ipAddress,
          browser,
          os,
          location,
          time: new Date().toISOString(),
        })
      }
    }

    return NextResponse.next()
  } catch (error) {
    console.error("Error tracking login:", error)
    return NextResponse.next()
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

