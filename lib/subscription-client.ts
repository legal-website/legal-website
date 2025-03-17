import type { Subscription, SubscriptionPlan, SubscriptionStats } from "@/types/subscription"

// Get all subscriptions
export async function getSubscriptions(
  page = 1,
  limit = 10,
  status?: string,
): Promise<{ subscriptions: Subscription[]; total: number }> {
  try {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })

    if (status && status !== "all") {
      queryParams.append("status", status)
    }

    const response = await fetch(`/api/admin/subscriptions?${queryParams.toString()}`)

    if (!response.ok) {
      throw new Error("Failed to fetch subscriptions")
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching subscriptions:", error)
    throw error
  }
}

// Get subscription statistics
export async function getSubscriptionStats(): Promise<SubscriptionStats> {
  try {
    const response = await fetch("/api/admin/subscriptions/stats")

    if (!response.ok) {
      throw new Error("Failed to fetch subscription stats")
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching subscription stats:", error)
    throw error
  }
}

// Update a subscription
export async function updateSubscription(id: string, data: Partial<Subscription>): Promise<Subscription> {
  try {
    const response = await fetch(`/api/admin/subscriptions/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error("Failed to update subscription")
    }

    return await response.json()
  } catch (error) {
    console.error("Error updating subscription:", error)
    throw error
  }
}

// Cancel a subscription
export async function cancelSubscription(id: string, cancellationReason?: string): Promise<Subscription> {
  try {
    const response = await fetch(`/api/admin/subscriptions/${id}/cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cancellationReason }),
    })

    if (!response.ok) {
      throw new Error("Failed to cancel subscription")
    }

    return await response.json()
  } catch (error) {
    console.error("Error canceling subscription:", error)
    throw error
  }
}

// Create a subscription plan
export async function createSubscriptionPlan(data: Omit<SubscriptionPlan, "id">): Promise<SubscriptionPlan> {
  try {
    const response = await fetch("/api/admin/subscription-plans", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error("Failed to create subscription plan")
    }

    return await response.json()
  } catch (error) {
    console.error("Error creating subscription plan:", error)
    throw error
  }
}

// Update a subscription plan
export async function updateSubscriptionPlan(
  id: string,
  data: Partial<Omit<SubscriptionPlan, "id">>,
): Promise<SubscriptionPlan> {
  try {
    const response = await fetch(`/api/admin/subscription-plans/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error("Failed to update subscription plan")
    }

    return await response.json()
  } catch (error) {
    console.error("Error updating subscription plan:", error)
    throw error
  }
}

// Delete a subscription plan
export async function deleteSubscriptionPlan(id: string): Promise<void> {
  try {
    const response = await fetch(`/api/admin/subscription-plans/${id}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      throw new Error("Failed to delete subscription plan")
    }
  } catch (error) {
    console.error("Error deleting subscription plan:", error)
    throw error
  }
}

