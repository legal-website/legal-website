"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"

// Define interfaces for our database models
interface User {
  id: string
  email: string
  name?: string | null
  password?: string | null
}

interface UserSettings {
  id: string
  userId: string
  theme: string
  accentColor: string
  layoutDensity: string
  loginNotificationsEnabled: boolean
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
  createdAt: Date
}

// Function to update user appearance settings
export async function updateAppearanceSettings(formData: FormData) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" }
    }

    const theme = formData.get("theme") as string
    const accentColor = formData.get("accentColor") as string
    const layoutDensity = formData.get("layoutDensity") as string

    // Check if user settings exist using raw SQL
    const existingSettings = await db.$queryRaw<UserSettings[]>`
      SELECT * FROM UserSettings WHERE userId = ${session.user.id}
    `

    if (existingSettings.length > 0) {
      // Update existing settings
      await db.$executeRaw`
        UPDATE UserSettings 
        SET theme = ${theme}, 
            accentColor = ${accentColor}, 
            layoutDensity = ${layoutDensity},
            updatedAt = NOW()
        WHERE userId = ${session.user.id}
      `
    } else {
      // Create new settings
      await db.$executeRaw`
        INSERT INTO UserSettings 
        (id, userId, theme, accentColor, layoutDensity, loginNotificationsEnabled, createdAt, updatedAt) 
        VALUES 
        (UUID(), ${session.user.id}, ${theme}, ${accentColor}, ${layoutDensity}, false, NOW(), NOW())
      `
    }

    revalidatePath("/dashboard/settings")
    return { success: true, message: "Appearance settings updated successfully" }
  } catch (error) {
    console.error("Error updating appearance settings:", error)
    return { success: false, message: "Failed to update appearance settings" }
  }
}

// Function to update user password
export async function updatePassword(formData: FormData) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" }
    }

    const currentPassword = formData.get("currentPassword") as string
    const newPassword = formData.get("newPassword") as string
    const confirmPassword = formData.get("confirmPassword") as string

    // Validate passwords
    if (!currentPassword || !newPassword || !confirmPassword) {
      return { success: false, message: "All password fields are required" }
    }

    if (newPassword !== confirmPassword) {
      return { success: false, message: "New passwords do not match" }
    }

    // Get user with password
    const users = await db.$queryRaw<User[]>`
      SELECT * FROM User WHERE id = ${session.user.id}
    `

    const user = users.length > 0 ? users[0] : null

    if (!user || !user.password) {
      return { success: false, message: "User not found or no password set" }
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isPasswordValid) {
      return { success: false, message: "Current password is incorrect" }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update password
    await db.$executeRaw`
      UPDATE User 
      SET password = ${hashedPassword} 
      WHERE id = ${session.user.id}
    `

    return { success: true, message: "Password updated successfully" }
  } catch (error) {
    console.error("Error updating password:", error)
    return { success: false, message: "Failed to update password" }
  }
}

// Function to toggle email notifications for login attempts
export async function toggleLoginNotifications(enabled: boolean) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" }
    }

    // Check if user settings exist
    const existingSettings = await db.$queryRaw<UserSettings[]>`
      SELECT * FROM UserSettings WHERE userId = ${session.user.id}
    `

    if (existingSettings.length > 0) {
      // Update existing settings
      await db.$executeRaw`
        UPDATE UserSettings 
        SET loginNotificationsEnabled = ${enabled},
            updatedAt = NOW()
        WHERE userId = ${session.user.id}
      `
    } else {
      // Create new settings
      await db.$executeRaw`
        INSERT INTO UserSettings 
        (id, userId, theme, accentColor, layoutDensity, loginNotificationsEnabled, createdAt, updatedAt) 
        VALUES 
        (UUID(), ${session.user.id}, 'light', '#22c984', 'comfortable', ${enabled}, NOW(), NOW())
      `
    }

    revalidatePath("/dashboard/settings")
    return { success: true, message: `Login notifications ${enabled ? "enabled" : "disabled"} successfully` }
  } catch (error) {
    console.error("Error updating login notifications:", error)
    return { success: false, message: "Failed to update login notifications" }
  }
}

// Function to get user settings
export async function getUserSettings() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return null
    }

    const settings = await db.$queryRaw<UserSettings[]>`
      SELECT * FROM UserSettings WHERE userId = ${session.user.id}
    `

    if (settings.length > 0) {
      return settings[0]
    }

    return {
      theme: "light",
      accentColor: "#22c984",
      layoutDensity: "comfortable",
      loginNotificationsEnabled: false,
    }
  } catch (error) {
    console.error("Error fetching user settings:", error)
    return null
  }
}

// Function to get user login sessions
export async function getUserLoginSessions() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return []
    }

    const loginSessions = await db.$queryRaw<LoginSession[]>`
      SELECT * FROM LoginSession 
      WHERE userId = ${session.user.id}
      ORDER BY lastActiveAt DESC
    `

    return loginSessions
  } catch (error) {
    console.error("Error fetching login sessions:", error)
    return []
  }
}

