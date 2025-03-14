import { PrismaClient } from "@prisma/client"
import type { ExtendedPrismaClient } from "./prisma-types"

const prismaClientSingleton = () => {
  return new PrismaClient() as ExtendedPrismaClient
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined
}

const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

export const db = prisma

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

