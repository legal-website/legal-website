import type { Subscription, SubscriptionPlan, SubscriptionStats } from "@/types/subscription"

// Get all subscriptions with pagination and filtering
export async function getSubscriptions(
  page = 1,
  limit = 10,
  status?: string,
): Promise<{ subscriptions: Subscription[]; total: number }> {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })

    if (status) {
      params.append("status", status)
    }

    const response = await fetch(`/api/admin/subscriptions?${params.toString()}`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Failed to fetch subscriptions: ${response.status}`)
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
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Failed to fetch subscription stats: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching subscription stats:", error)
    throw error
  }
}

// Create a new subscription plan
export async function createSubscriptionPlan(planData: Omit<SubscriptionPlan, "id">): Promise<SubscriptionPlan> {
  try {
    const response = await fetch("/api/admin/subscription-plans", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(planData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Failed to create subscription plan: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error creating subscription plan:", error)
    throw error
  }
}

// Update an existing subscription plan
export async function updateSubscriptionPlan(
  id: string,
  planData: Partial<Omit<SubscriptionPlan, "id">>,
): Promise<SubscriptionPlan> {
  try {
    const response = await fetch(`/api/admin/subscription-plans/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(planData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Failed to update subscription plan: ${response.status}`)
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
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Failed to delete subscription plan: ${response.status}`)
    }
  } catch (error) {
    console.error("Error deleting subscription plan:", error)
    throw error
  }
}

// Cancel a subscription
export async function cancelSubscription(id: string, reason?: string): Promise<Subscription> {
  try {
    const response = await fetch(`/api/admin/subscriptions/${id}/cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Failed to cancel subscription: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error canceling subscription:", error)
    throw error
  }
}

