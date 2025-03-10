import prisma from "@/lib/prisma"
import type { Role } from "./auth-service"

// Create a new business
export async function createBusiness(data: {
  name: string
  email?: string
  phone?: string
  address?: string
  website?: string
  industry?: string
  formationDate?: Date
  ein?: string
  businessId?: string
}) {
  return prisma.business.create({
    data,
  })
}

// Get all businesses (for admin dashboard)
export async function getAllBusinesses(page = 1, limit = 10) {
  const skip = (page - 1) * limit

  const [businesses, total] = await Promise.all([
    prisma.business.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        subscriptions: true,
      },
    }),
    prisma.business.count(),
  ])

  return { businesses, total }
}

// Get a business by ID
export async function getBusinessById(id: string) {
  return prisma.business.findUnique({
    where: { id },
    include: {
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      documents: true,
      subscriptions: true,
    },
  })
}

// Update a business
export async function updateBusiness(
  id: string,
  data: {
    name?: string
    email?: string
    phone?: string
    address?: string
    website?: string
    industry?: string
    formationDate?: Date
    ein?: string
    businessId?: string
  },
) {
  return prisma.business.update({
    where: { id },
    data,
  })
}

// Add a user to a business
export async function addUserToBusiness(
  businessId: string,
  userData: {
    email: string
    name: string
    password: string
    role?: Role
  },
) {
  // This would use the auth service to hash the password
  const { hashPassword } = await import("./auth-service")
  const hashedPassword = await hashPassword(userData.password)

  return prisma.user.create({
    data: {
      email: userData.email,
      name: userData.name,
      password: hashedPassword,
      role: userData.role || "CLIENT",
      business: {
        connect: { id: businessId },
      },
    },
  })
}

// Get users for a business
export async function getBusinessUsers(businessId: string) {
  return prisma.user.findMany({
    where: { businessId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  })
}

