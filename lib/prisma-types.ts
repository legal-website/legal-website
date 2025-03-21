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

// Define Role enum to match Prisma schema
export enum Role {
  ADMIN = "ADMIN",
  SUPPORT = "SUPPORT",
  CLIENT = "CLIENT",
}

// Define VerificationToken model
export interface VerificationTokenModel {
  id: string
  token: string
  identifier: string
  expires: Date
  userId: string
  user?: UserModel
}

// Define User model for relationships
export interface UserModel {
  id: string
  name: string | null
  email: string
  role: string
  image?: string | null
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

// Annual Report Deadline model
export interface AnnualReportDeadlineModel {
  id: string
  userId: string
  title: string
  description: string | null
  dueDate: Date
  fee: Decimal
  lateFee: Decimal | null
  status: string
  createdAt: Date
  updatedAt: Date
  user: UserModel
  filings?: AnnualReportFilingModel[]
}

// Annual Report Filing model
export interface AnnualReportFilingModel {
  id: string
  deadlineId: string
  userId: string
  receiptUrl: string | null
  reportUrl: string | null
  status: string
  adminNotes: string | null
  userNotes: string | null
  filedDate: Date | null
  createdAt: Date
  updatedAt: Date
  deadline: AnnualReportDeadlineModel
  user: UserModel
}

// Filing Requirement model
export interface FilingRequirementModel {
  id: string
  title: string
  description: string
  details: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Community models
export interface PostModel {
  id: string
  title: string
  content: string
  authorId: string
  status: string
  createdAt: Date
  updatedAt: Date
  author?: UserModel
  comments?: CommentModel[]
  likes?: LikeModel[]
  tags?: PostTagModel[]
  _count?: {
    likes: number
    comments: number
  }
}

export interface CommentModel {
  id: string
  content: string
  postId: string
  authorId: string
  createdAt: Date
  updatedAt: Date
  post?: PostModel
  author?: UserModel
  likes?: LikeModel[]
  _count?: {
    likes: number
  }
}

export interface LikeModel {
  id: string
  postId?: string | null
  commentId?: string | null
  authorId: string
  createdAt: Date
  post?: PostModel
  comment?: CommentModel
  author?: UserModel
}

export interface TagModel {
  id: string
  name: string
  posts?: PostTagModel[]
  _count?: {
    posts: number
  }
}

export interface PostTagModel {
  id: string
  postId: string
  tagId: string
  post?: PostModel
  tag?: TagModel
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

// Define VerificationToken delegate
export interface VerificationTokenDelegate {
  findFirst: (args: { where: any; orderBy?: any }) => Promise<VerificationTokenModel | null>
  count: (args: { where: any }) => Promise<number>
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

// Add these delegates to your ExtendedPrismaClient type
export interface AnnualReportDeadlineDelegate {
  findMany: (args?: any) => Promise<AnnualReportDeadlineModel[]>
  findUnique: (args: { where: { id: string } }) => Promise<AnnualReportDeadlineModel | null>
  create: (args: { data: any; include?: any }) => Promise<AnnualReportDeadlineModel>
  update: (args: { where: { id: string }; data: any }) => Promise<AnnualReportDeadlineModel>
  delete: (args: { where: { id: string } }) => Promise<AnnualReportDeadlineModel>
}

export interface AnnualReportFilingDelegate {
  findMany: (args?: any) => Promise<AnnualReportFilingModel[]>
  findUnique: (args: { where: { id: string } }) => Promise<AnnualReportFilingModel | null>
  create: (args: { data: any; include?: any }) => Promise<AnnualReportFilingModel>
  update: (args: { where: { id: string }; data: any }) => Promise<AnnualReportFilingModel>
  delete: (args: { where: { id: string } }) => Promise<AnnualReportFilingModel>
}

export interface FilingRequirementDelegate {
  findMany: (args?: any) => Promise<FilingRequirementModel[]>
  findUnique: (args: { where: { id: string } }) => Promise<FilingRequirementModel | null>
  create: (args: { data: any }) => Promise<FilingRequirementModel>
  update: (args: { where: { id: string }; data: any }) => Promise<FilingRequirementModel>
  delete: (args: { where: { id: string } }) => Promise<FilingRequirementModel>
}

// Community delegates
export interface PostDelegate {
  findMany: (args?: any) => Promise<PostModel[]>
  findUnique: (args: { where: { id: string }; include?: any }) => Promise<PostModel | null>
  create: (args: { data: any; include?: any }) => Promise<PostModel>
  update: (args: { where: { id: string }; data: any }) => Promise<PostModel>
  delete: (args: { where: { id: string } }) => Promise<PostModel>
  count: (args?: any) => Promise<number>
}

export interface CommentDelegate {
  findMany: (args?: any) => Promise<CommentModel[]>
  findUnique: (args: { where: { id: string }; include?: any }) => Promise<CommentModel | null>
  create: (args: { data: any; include?: any }) => Promise<CommentModel>
  update: (args: { where: { id: string }; data: any }) => Promise<CommentModel>
  delete: (args: { where: { id: string } }) => Promise<CommentModel>
  count: (args?: any) => Promise<number>
}

export interface LikeDelegate {
  findMany: (args?: any) => Promise<LikeModel[]>
  findFirst: (args: { where: any }) => Promise<LikeModel | null>
  create: (args: { data: any }) => Promise<LikeModel>
  delete: (args: { where: any }) => Promise<LikeModel>
  deleteMany: (args: { where: any }) => Promise<{ count: number }>
}

export interface TagDelegate {
  findMany: (args?: any) => Promise<TagModel[]>
  findUnique: (args: { where: any; include?: any }) => Promise<TagModel | null>
  create: (args: { data: any }) => Promise<TagModel>
  update: (args: { where: any; data: any }) => Promise<TagModel>
  count: (args?: any) => Promise<number>
}

export interface PostTagDelegate {
  create: (args: { data: any }) => Promise<PostTagModel>
  deleteMany: (args: { where: any }) => Promise<{ count: number }>
}

// Extended PrismaClient with all models - SINGLE DEFINITION
export type ExtendedPrismaClient = Omit<PrismaClient, "amendment"> & {
  amendment: AmendmentDelegate
  amendmentStatusHistory: AmendmentStatusHistoryDelegate
  annualReportDeadline: AnnualReportDeadlineDelegate
  annualReportFiling: AnnualReportFilingDelegate
  filingRequirement: FilingRequirementDelegate
  verificationToken: VerificationTokenDelegate
  // Add community models
  post: PostDelegate
  comment: CommentDelegate
  like: LikeDelegate
  tag: TagDelegate
  postTag: PostTagDelegate
  // Include raw query methods with proper typing
  $queryRaw: any // Using 'any' to avoid TypeScript errors
  $executeRaw: any // Using 'any' to avoid TypeScript errors
  $queryRawUnsafe: <T = any>(query: string, ...values: any[]) => Promise<T>
  $executeRawUnsafe: <T = any>(query: string, ...values: any[]) => Promise<T>
}

