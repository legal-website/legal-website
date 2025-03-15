import { z } from "zod"

// User roles
export const UserRole = {
  USER: "USER",
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const

// User schema with validation
export const userSchema = z.object({
  id: z.string().optional(),
  email: z.string().email({ message: "Invalid email address" }),
  name: z.string().min(2, { message: "Name must be at least 2 characters" }).optional(),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }).optional(),
  role: z.enum([UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN]).default(UserRole.USER),
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

// Business Document schema
export const businessDocumentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, { message: "Document name must be at least 2 characters" }),
  description: z.string().optional(),
  category: z.string(),
  fileUrl: z.string(),
  fileType: z.string(),
  fileSize: z.number(), // Size in bytes
  isPermanent: z.boolean().default(false), // Whether document can be deleted
  businessId: z.string(), // Reference to business
  uploadedById: z.string(), // Reference to user who uploaded
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

export type BusinessDocument = z.infer<typeof businessDocumentSchema>

// Document Sharing schema
export const documentSharingSchema = z.object({
  id: z.string().optional(),
  documentId: z.string(),
  sharedWithEmail: z.string().email({ message: "Invalid email address" }),
  sharedById: z.string(),
  accessExpires: z.date().optional(), // Optional expiration date
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

export type DocumentSharing = z.infer<typeof documentSharingSchema>

// Business Storage schema
export const businessStorageSchema = z.object({
  id: z.string().optional(),
  businessId: z.string(),
  totalStorageBytes: z.number().default(0), // Total storage used in bytes
  storageLimit: z.number().default(104857600), // Default 100MB in bytes
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

export type BusinessStorage = z.infer<typeof businessStorageSchema>

