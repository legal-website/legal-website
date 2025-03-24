import type { CouponType } from "./prisma-types"

export function formatCouponValue(type: CouponType, value: number | string): string {
  if (type === "PERCENTAGE") {
    return `${value}%`
  } else if (type === "FIXED_AMOUNT") {
    return `$${value}`
  } else if (type === "FREE_SERVICE") {
    return "Free Service"
  }
  return `${value}`
}

export function calculateDiscount(couponType: CouponType, couponValue: number, cartTotal: number): number {
  if (couponType === "PERCENTAGE") {
    return (cartTotal * couponValue) / 100
  } else if (couponType === "FIXED_AMOUNT") {
    return Math.min(cartTotal, couponValue)
  }
  return 0
}

export function getCouponStatus(isActive: boolean, startDate: Date, endDate: Date): "Active" | "Scheduled" | "Expired" {
  const now = new Date()

  if (!isActive) {
    return "Expired"
  } else if (startDate > now) {
    return "Scheduled"
  } else if (endDate < now) {
    return "Expired"
  }

  return "Active"
}

