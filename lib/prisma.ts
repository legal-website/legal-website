import { PrismaClient } from "@prisma/client"

// Define global type for PrismaClient to avoid "Property does not exist" errors
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const prisma = global.prisma || new PrismaClient()

if (process.env.NODE_ENV !== "production") global.prisma = prisma

export default prisma

