import { PrismaClient } from "@prisma/client"
import type { User } from "./schema"

const prisma = new PrismaClient()

// Get user by email from database
export async function getUserByEmail(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    })
    return user
  } catch (error) {
    console.error("Error getting user by email:", error)
    return null
  }
}

// Validate user credentials against database
export async function validateUserCredentials(email: string, password: string) {
  try {
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user || !user.password) {
      return null
    }

    // Check if password matches
    // Note: This assumes passwords are stored as plain text in your database
    // If they're hashed, you'll need to use your hashing method
    const isValid = user.password === password

    if (!isValid) {
      return null
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
  } catch (error) {
    console.error("Error validating user credentials:", error)
    return null
  }
}

// Get all admin users
export async function getAllAdminUsers() {
  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [{ role: "ADMIN" }, { role: "SUPER_ADMIN" }],
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    return users
  } catch (error) {
    console.error("Error getting admin users:", error)
    return []
  }
}

// Create admin user
export async function createAdminUser(userData: Omit<User, "id" | "createdAt" | "updatedAt">) {
  try {
    // Create user in database
    const user = await prisma.user.create({
      data: {
        ...userData,
        role: "ADMIN", // Default to ADMIN role
      },
    })

    // Return user without password
    const { password, ...userWithoutPassword } = user
    return userWithoutPassword
  } catch (error) {
    console.error("Error creating admin user:", error)
    throw error
  }
}

// Update admin user
export async function updateAdminUser(id: string, userData: Partial<User>) {
  try {
    // Update user in database
    const user = await prisma.user.update({
      where: { id },
      data: userData,
    })

    // Return user without password
    const { password, ...userWithoutPassword } = user
    return userWithoutPassword
  } catch (error) {
    console.error("Error updating admin user:", error)
    throw error
  }
}

// Delete admin user
export async function deleteAdminUser(id: string) {
  try {
    await prisma.user.delete({
      where: { id },
    })
    return true
  } catch (error) {
    console.error("Error deleting admin user:", error)
    return false
  }
}

