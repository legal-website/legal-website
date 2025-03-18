import { z } from "zod"

// User roles
export const UserRole = {
  USER: "USER",
  ADMIN: "ADMIN",
  SUPPORT: "SUPPORT",
  CLIENT: "CLIENT",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const

// User schema with validation
export const userSchema = z.object({
  id: z.string().optional(),
  email: z.string().email({ message: "Invalid email address" }),
  name: z.string().min(2, { message: "Name must be at least 2 characters" }).optional(),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }).optional(),
  role: z
    .enum([UserRole.USER, UserRole.ADMIN, UserRole.SUPPORT, UserRole.CLIENT, UserRole.SUPER_ADMIN])
    .default(UserRole.CLIENT),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

export type User = z.infer<typeof userSchema>

// Login schema
export const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
})

// Business schema with validation
export const businessSchema = z.object({
  id: z.string().optional(),
  businessId: z.string().optional(), // Unique business ID
  businessName: z.string().min(2, { message: "Business name must be at least 2 characters" }),
  formationDate: z.date().optional(),
  einNumber: z.string().optional(),
  serviceStatus: z.enum(["Under Approval", "Pending", "Active"]).default("Pending"),
  llcStatus: z.number().min(0).max(100).default(10), // Progress percentage
  llcStatusMessage: z.string().optional(),
  userId: z.string().optional(), // Reference to user
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

export type Business = z.infer<typeof businessSchema>

// Document Template schema
export const templatePricingTier = {
  FREE: "Free",
  BASIC: "Basic",
  STANDARD: "Standard",
  PREMIUM: "Premium",
} as const

export const templateSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, { message: "Template name must be at least 2 characters" }),
  description: z.string().optional(),
  category: z.string(),
  pricingTier: z
    .enum([
      templatePricingTier.FREE,
      templatePricingTier.BASIC,
      templatePricingTier.STANDARD,
      templatePricingTier.PREMIUM,
    ])
    .default(templatePricingTier.FREE),
  price: z.number().min(0),
  fileUrl: z.string().optional(),
  status: z.enum(["active", "inactive", "draft"]).default("active"),
  usageCount: z.number().default(0),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

export type Template = z.infer<typeof templateSchema>

// User Template Access schema
export const userTemplateAccessSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  templateId: z.string(),
  invoiceId: z.string().optional(),
  status: z.enum(["pending", "active", "expired"]).default("pending"),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

export type UserTemplateAccess = z.infer<typeof userTemplateAccessSchema>

// Amendment status enum
export const AmendmentStatus = {
  PENDING: "pending",
  IN_REVIEW: "in_review",
  WAITING_FOR_PAYMENT: "waiting_for_payment",
  PAYMENT_RECEIVED: "payment_received",
  APPROVED: "approved",
  REJECTED: "rejected",
  CLOSED: "closed",
} as const

// Amendment schema with validation
export const amendmentSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  type: z.string(),
  details: z.string(),
  status: z
    .enum([
      AmendmentStatus.PENDING,
      AmendmentStatus.IN_REVIEW,
      AmendmentStatus.WAITING_FOR_PAYMENT,
      AmendmentStatus.PAYMENT_RECEIVED,
      AmendmentStatus.APPROVED,
      AmendmentStatus.REJECTED,
      AmendmentStatus.CLOSED,
    ])
    .default(AmendmentStatus.PENDING),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  documentUrl: z.string().nullable().optional(),
  receiptUrl: z.string().nullable().optional(),
  paymentAmount: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export type Amendment = z.infer<typeof amendmentSchema>

// Amendment Status History schema
export const amendmentStatusHistorySchema = z.object({
  id: z.string().optional(),
  amendmentId: z.string(),
  status: z.string(),
  createdAt: z.date().optional(),
  notes: z.string().nullable().optional(),
  updatedBy: z.string().nullable().optional(),
})

export type AmendmentStatusHistory = z.infer<typeof amendmentStatusHistorySchema>

// Amendment update schema for API requests
export const amendmentUpdateSchema = z.object({
  status: z.enum([
    AmendmentStatus.PENDING,
    AmendmentStatus.IN_REVIEW,
    AmendmentStatus.WAITING_FOR_PAYMENT,
    AmendmentStatus.PAYMENT_RECEIVED,
    AmendmentStatus.APPROVED,
    AmendmentStatus.REJECTED,
    AmendmentStatus.CLOSED,
  ]),
  paymentAmount: z.number().optional(),
  notes: z.string().optional(),
})

export type AmendmentUpdate = z.infer<typeof amendmentUpdateSchema>

