import prisma from "@/lib/prisma"

// Create a new subscription
export async function createSubscription(data: {
  planId: string
  planName: string
  price: number
  billingCycle: string
  status: string
  startDate: Date
  nextBillingDate: Date
  businessId: string
}) {
  return prisma.subscription.create({
    data,
  })
}

// Get all subscriptions (for admin dashboard)
export async function getAllSubscriptions(page = 1, limit = 10) {
  const skip = (page - 1) * limit

  const [subscriptions, total] = await Promise.all([
    prisma.subscription.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.subscription.count(),
  ])

  return { subscriptions, total }
}

// Get subscriptions for a business
export async function getBusinessSubscriptions(businessId: string) {
  return prisma.subscription.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
  })
}

// Update a subscription
export async function updateSubscription(
  id: string,
  data: {
    planId?: string
    planName?: string
    price?: number
    billingCycle?: string
    status?: string
    startDate?: Date
    nextBillingDate?: Date
  },
) {
  return prisma.subscription.update({
    where: { id },
    data,
  })
}

// Cancel a subscription
export async function cancelSubscription(id: string, cancellationReason?: string) {
  return prisma.subscription.update({
    where: { id },
    data: {
      status: "canceled",
      // You might want to store the cancellation reason in a separate field or table
    },
  })
}

