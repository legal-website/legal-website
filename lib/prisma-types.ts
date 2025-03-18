import type { PrismaClient } from "@prisma/client"
import type { Decimal } from "@prisma/client/runtime/library"

// Define invoice item interface to help with template identification
export interface InvoiceItem {
  id?: string
  tier?: string
  price?: number
  stateFee?: number
  state?: string
  discount?: number
  templateId?: string
  type?: string
}

// This is a workaround for TypeScript not recognizing the new models
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

    interface AccountManagerRequestModel {
      id: string
      userId: string
      status: string
      managerName?: string | null
      contactLink?: string | null
      createdAt: Date
      updatedAt: Date
    }
  }
}

// Define User model for relationships
export interface UserModel {
  id: string
  name: string | null
  email: string
  role: string
  // Add other fields as needed
}

// Define Amendment status history model
export interface AmendmentStatusHistoryModel {
  id: string
  amendmentId: string
  status: string
  createdAt: Date
  notes: string | null
  updatedBy: string | null
}

// Define Amendment model with relationships
export interface AmendmentModel {
  id: string
  userId: string
  type: string
  details: string
  status: string
  createdAt: Date
  updatedAt: Date
  documentUrl: string | null
  receiptUrl: string | null
  paymentAmount: Decimal | null
  notes: string | null
  user: UserModel
  statusHistory: AmendmentStatusHistoryModel[]
}

// Define query options types
export interface AmendmentInclude {
  user?: boolean | { select?: { id?: boolean; name?: boolean; email?: boolean } }
  statusHistory?: boolean | { orderBy?: { createdAt?: "asc" | "desc" } }
}

export interface AmendmentFindManyArgs {
  include?: AmendmentInclude
  orderBy?: { updatedAt?: "asc" | "desc"; createdAt?: "asc" | "desc" }
  where?: any
}

export interface AmendmentFindUniqueArgs {
  where: { id: string }
  include?: AmendmentInclude
}

export interface AmendmentUpdateArgs {
  where: { id: string }
  data: any
  include?: AmendmentInclude
}

// Define Amendment model operations with proper typing
export interface AmendmentDelegate {
  findMany: (args?: AmendmentFindManyArgs) => Promise<AmendmentModel[]>
  findUnique: (args: AmendmentFindUniqueArgs) => Promise<AmendmentModel | null>
  update: (args: AmendmentUpdateArgs) => Promise<AmendmentModel>
  create: (args: { data: any; include?: AmendmentInclude }) => Promise<AmendmentModel>
}

export interface AmendmentStatusHistoryDelegate {
  create: (args: { data: any }) => Promise<AmendmentStatusHistoryModel>
}

// Extended PrismaClient with Amendment models
export type ExtendedPrismaClient = Omit<PrismaClient, "amendment"> & {
  amendment: AmendmentDelegate
  amendmentStatusHistory: AmendmentStatusHistoryDelegate
}

