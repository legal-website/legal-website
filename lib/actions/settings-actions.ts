"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"

// Function to update user appearance settings
export async function updateAppearanceSettings(formData: FormData) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" }
    }

    const theme = formData.get("theme") as string
    const layoutDensity = formData.get("layoutDensity") as string

    // Check if user settings exist
    const existingSettings = await prisma.$queryRawUnsafe<any[]>(
      `
      SELECT * FROM UserSettings WHERE userId = ? LIMIT 1
    `,
      session.user.id,
    )

    if (existingSettings.length > 0) {
      // Update existing settings
      await prisma.$executeRawUnsafe(
        `
        UPDATE UserSettings 
        SET theme = ?, 
            layoutDensity = ?,
            updatedAt = NOW()
        WHERE userId = ?
      `,
        theme,
        layoutDensity,
        session.user.id,
      )
    } else {
      // Generate a UUID for the settings ID
      const settingsId = crypto.randomUUID()

      // Create new settings
      await prisma.$executeRawUnsafe(
        `
        INSERT INTO UserSettings 
        (id, userId, theme, layoutDensity, loginNotificationsEnabled, createdAt, updatedAt) 
        VALUES 
        (?, ?, ?, ?, false, NOW(), NOW())
      `,
        settingsId,
        session.user.id,
        theme,
        layoutDensity,
      )
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
    const users = await prisma.$queryRawUnsafe<any[]>(
      `
      SELECT * FROM User WHERE id = ? LIMIT 1
    `,
      session.user.id,
    )

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
    await prisma.$executeRawUnsafe(
      `
      UPDATE User 
      SET password = ? 
      WHERE id = ?
    `,
      hashedPassword,
      session.user.id,
    )

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
    const existingSettings = await prisma.$queryRawUnsafe<any[]>(
      `
      SELECT * FROM UserSettings WHERE userId = ? LIMIT 1
    `,
      session.user.id,
    )

    if (existingSettings.length > 0) {
      // Update existing settings
      await prisma.$executeRawUnsafe(
        `
        UPDATE UserSettings 
        SET loginNotificationsEnabled = ?,
            updatedAt = NOW()
        WHERE userId = ?
      `,
        enabled ? 1 : 0,
        session.user.id,
      )
    } else {
      // Generate a UUID for the settings ID
      const settingsId = crypto.randomUUID()

      // Create new settings
      await prisma.$executeRawUnsafe(
        `
        INSERT INTO UserSettings 
        (id, userId, theme, layoutDensity, loginNotificationsEnabled, createdAt, updatedAt) 
        VALUES 
        (?, ?, 'light', 'comfortable', ?, NOW(), NOW())
      `,
        settingsId,
        session.user.id,
        enabled ? 1 : 0,
      )
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

    const settings = await prisma.$queryRawUnsafe<any[]>(
      `
      SELECT * FROM UserSettings WHERE userId = ? LIMIT 1
    `,
      session.user.id,
    )

    if (settings.length > 0) {
      return {
        theme: settings[0].theme || "light",
        layoutDensity: settings[0].layoutDensity || "comfortable",
        loginNotificationsEnabled: Boolean(settings[0].loginNotificationsEnabled),
      }
    }

    return {
      theme: "light",
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

    const loginSessions = await prisma.$queryRawUnsafe<any[]>(
      `
      SELECT * FROM LoginSession 
      WHERE userId = ?
      ORDER BY lastActiveAt DESC
    `,
      session.user.id,
    )

    return loginSessions.map((session: { lastActiveAt: string | number | Date; createdAt: string | number | Date }) => ({
      ...session,
      lastActiveAt: new Date(session.lastActiveAt),
      createdAt: new Date(session.createdAt),
    }))
  } catch (error) {
    console.error("Error fetching login sessions:", error)
    return []
  }
}

