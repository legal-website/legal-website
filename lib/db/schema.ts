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

