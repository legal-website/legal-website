import type { PrismaClient } from "@prisma/client"

// This is a workaround for TypeScript not recognizing the new model
declare global {
  namespace PrismaJson {
    interface PhoneNumberRequestModel {
      id: string
      userId: string
      phoneNumber?: string | null
      status: string
      createdAt: Date
      updatedAt: Date
    }
  }
}

// Extend the PrismaClient type
export interface ExtendedPrismaClient extends PrismaClient {
  phoneNumberRequest: {
    findFirst: (args: any) => Promise<any>
    findUnique: (args: any) => Promise<any>
    findMany: (args: any) => Promise<any[]>
    create: (args: any) => Promise<any>
    update: (args: any) => Promise<any>
    delete: (args: any) => Promise<any>
    upsert: (args: any) => Promise<any>
    count: (args: any) => Promise<number>
  }
}

