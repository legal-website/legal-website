import type { Subscription, SubscriptionPlan, SubscriptionStats } from "@/types/subscription"

// Get all subscriptions with pagination and filtering
export async function getSubscriptions(
  page = 1,
  limit = 10,
  status?: string,
): Promise<{ subscriptions: Subscription[]; total: number }> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  })

  if (status) {
    params.append("status", status)
  }

  const response = await fetch(`/api/admin/subscriptions?${params.toString()}`)

  if (!response.ok) {
    throw new Error("Failed to fetch subscriptions")
  }

  return response.json()
}

// Get subscription statistics
export async function getSubscriptionStats(): Promise<SubscriptionStats> {
  const response = await fetch("/api/admin/subscriptions/stats")

  if (!response.ok) {
    throw new Error("Failed to fetch subscription statistics")
  }

  return response.json()
}

// Cancel a subscription
export async function cancelSubscription(id: string, reason?: string): Promise<Subscription> {
  const response = await fetch(`/api/admin/subscriptions/${id}/cancel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reason }),
  })

  if (!response.ok) {
    throw new Error("Failed to cancel subscription")
  }

  return response.json()
}

// Create a new subscription plan
export async function createSubscriptionPlan(plan: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
  const response = await fetch("/api/admin/subscription-plans", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(plan),
  })

  if (!response.ok) {
    throw new Error("Failed to create subscription plan")
  }

  return response.json()
}

// Update an existing subscription plan
export async function updateSubscriptionPlan(id: string, plan: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
  const response = await fetch(`/api/admin/subscription-plans/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(plan),
  })

  if (!response.ok) {
    throw new Error("Failed to update subscription plan")
  }

  return response.json()
}

// Delete a subscription plan
export async function deleteSubscriptionPlan(id: string): Promise<void> {
  const response = await fetch(`/api/admin/subscription-plans/${id}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    throw new Error("Failed to delete subscription plan")
  }
}

