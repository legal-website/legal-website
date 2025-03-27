import { Role } from "@/lib/enums"

// Check if a user has admin role
export function isAdmin(role: string | undefined): boolean {
  return role === Role.ADMIN
}

