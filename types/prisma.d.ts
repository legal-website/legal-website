import type { PrismaClient } from "@prisma/client"

declare global {
  namespace NodeJS {
    interface Global {
      prisma: PrismaClient
    }
  }
}

// Extend PrismaClient to include the AccountManagerRequest model
declare module "@prisma/client" {
  interface PrismaClient {
    accountManagerRequest: {
      findFirst: (args: any) => Promise<any>
      findUnique: (args: any) => Promise<any>
      create: (args: any) => Promise<any>
      update: (args: any) => Promise<any>
      delete: (args: any) => Promise<any>
    }
    amendment: PrismaClient["amendment"]
    amendmentStatusHistory: PrismaClient["amendmentStatusHistory"]
  }
}

