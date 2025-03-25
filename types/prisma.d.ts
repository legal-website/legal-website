import type { PrismaClient } from "@prisma/client"

// Avoid circular references by using a simpler approach
declare global {
  // This is for the global prisma instance
  var prisma: PrismaClient | undefined
}

// Don't try to extend PrismaClient directly, as it can cause conflicts
// with the generated types. Instead, create a module augmentation
// that just declares that these properties exist.
declare module "@prisma/client" {
  // Empty interface to avoid conflicts
}

// Export a type that can be used for type assertions
export type ExtendedPrismaClient = PrismaClient & {
  // Add any custom properties here
}

