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
  businessId?: string | null
  business?: BusinessModel | null
  // Add other fields as needed
}

// Define Business model
export interface BusinessModel {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
  website?: string | null
  industry?: string | null
  formationDate?: Date | null
  ein?: string | null
  businessId?: string | null
  createdAt: Date
  updatedAt: Date
  completedAt?: Date | null
  users?: UserModel[]
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

// Add the Document model interface after the Filing Requirement model
export interface DocumentModel {
  id: string
  name: string
  category: string
  createdAt: Date
  updatedAt: Date
  businessId: string
  fileUrl: string
  type: string
  business?: BusinessModel // Updated to use BusinessModel
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
  isBestAnswer?: boolean // Add this field
  moderationNotes?: string | null // Add this field
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

// Add the Document delegate interface after the Filing Requirement delegate
export interface DocumentDelegate {
  findMany: (args?: any) => Promise<DocumentModel[]>
  findUnique: (args: { where: { id: string } }) => Promise<DocumentModel | null>
  create: (args: { data: any }) => Promise<DocumentModel>
  update: (args: { where: { id: string }; data: any }) => Promise<DocumentModel>
  delete: (args: { where: { id: string } }) => Promise<DocumentModel>
}

// Add Business delegate
export interface BusinessDelegate {
  findMany: (args?: any) => Promise<BusinessModel[]>
  findUnique: (args: { where: { id: string } }) => Promise<BusinessModel | null>
  findFirst: (args: { where: any }) => Promise<BusinessModel | null>
  create: (args: { data: any }) => Promise<BusinessModel>
  update: (args: { where: { id: string }; data: any }) => Promise<BusinessModel>
  delete: (args: { where: { id: string } }) => Promise<BusinessModel>
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

// Add this interface to your existing interfaces
export interface UserDelegate {
  findUnique: (args: { where: { id: string }; select?: any }) => Promise<UserModel | null>
  findFirst: (args: { where: any; select?: any }) => Promise<UserModel | null>
  findMany: (args?: any) => Promise<UserModel[]>
  create: (args: { data: any; include?: any }) => Promise<UserModel>
  update: (args: { where: { id: string }; data: any }) => Promise<UserModel>
  delete: (args: { where: { id: string } }) => Promise<UserModel>
  count: (args?: any) => Promise<number>
}

// Add this interface to your existing interfaces
export interface SystemSettingsModel {
  id: number
  key: string
  value: string
}

export interface SystemSettingsDelegate {
  findFirst: (args: { where: any }) => Promise<SystemSettingsModel | null>
  findUnique: (args: { where: any }) => Promise<SystemSettingsModel | null>
  create: (args: { data: any }) => Promise<SystemSettingsModel>
  update: (args: { where: any; data: any }) => Promise<SystemSettingsModel>
  upsert: (args: { where: any; update: any; create: any }) => Promise<SystemSettingsModel>
}

// Add PricingSettings model and delegate
export interface PricingSettingsModel {
  id: number
  key: string
  value: string
  createdAt: Date
  updatedAt: Date
}

export interface PricingSettingsDelegate {
  findFirst: (args: { where: any }) => Promise<PricingSettingsModel | null>
  findUnique: (args: { where: any }) => Promise<PricingSettingsModel | null>
  create: (args: { data: any }) => Promise<PricingSettingsModel>
  update: (args: { where: any; data: any }) => Promise<PricingSettingsModel>
  upsert: (args: { where: any; update: any; create: any }) => Promise<PricingSettingsModel>
}

// Add these interfaces after the existing interfaces

// Affiliate models
export interface AffiliateLinkModel {
  id: string
  userId: string
  code: string
  createdAt: Date
  updatedAt: Date
  user?: UserModel
  clicks?: AffiliateClickModel[]
  conversions?: AffiliateConversionModel[]
  _count?: {
    clicks: number
    conversions: number
  }
}

export interface AffiliateClickModel {
  id: string
  linkId: string
  ipAddress?: string | null
  userAgent?: string | null
  referrer?: string | null
  createdAt: Date
  link?: AffiliateLinkModel
}

export enum AffiliateConversionStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  PAID = "PAID",
}

export interface AffiliateConversionModel {
  id: string
  linkId: string
  orderId: string
  amount: Decimal
  commission: Decimal
  status: AffiliateConversionStatus
  createdAt: Date
  updatedAt: Date
  link?: AffiliateLinkModel
}

export enum AffiliatePayoutStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  REJECTED = "REJECTED",
}

export interface AffiliatePayoutModel {
  id: string
  userId: string
  amount: Decimal
  method: string
  status: AffiliatePayoutStatus
  notes?: string | null
  createdAt: Date
  updatedAt: Date
  user?: UserModel
}

export interface AffiliateSettingsModel {
  id: number
  commissionRate: Decimal
  minPayoutAmount: Decimal
  cookieDuration: number
  updatedAt: Date
}

// Add these delegates
export interface AffiliateLinkDelegate {
  findUnique: (args: { where: any; include?: any }) => Promise<AffiliateLinkModel | null>
  findFirst: (args: { where: any; include?: any }) => Promise<AffiliateLinkModel | null>
  findMany: (args?: any) => Promise<AffiliateLinkModel[]>
  create: (args: { data: any; include?: any }) => Promise<AffiliateLinkModel>
  update: (args: { where: any; data: any; include?: any }) => Promise<AffiliateLinkModel>
  upsert: (args: { where: any; create: any; update: any; include?: any }) => Promise<AffiliateLinkModel>
  count: (args?: any) => Promise<number>
}

export interface AffiliateClickDelegate {
  create: (args: { data: any }) => Promise<AffiliateClickModel>
  findMany: (args?: any) => Promise<AffiliateClickModel[]>
  count: (args?: any) => Promise<number>
}

export interface AffiliateConversionDelegate {
  findMany: (args?: any) => Promise<AffiliateConversionModel[]>
  findUnique: (args: { where: any; include?: any }) => Promise<AffiliateConversionModel | null>
  create: (args: { data: any }) => Promise<AffiliateConversionModel>
  update: (args: { where: any; data: any }) => Promise<AffiliateConversionModel>
  count: (args?: any) => Promise<number>
}

export interface AffiliatePayoutDelegate {
  findMany: (args?: any) => Promise<AffiliatePayoutModel[]>
  findUnique: (args: { where: any }) => Promise<AffiliatePayoutModel | null>
  create: (args: { data: any }) => Promise<AffiliatePayoutModel>
  update: (args: { where: any; data: any }) => Promise<AffiliatePayoutModel>
}

export interface AffiliateSettingsDelegate {
  findFirst: (args?: any) => Promise<AffiliateSettingsModel | null>
  upsert: (args: { where: any; create: any; update: any }) => Promise<AffiliateSettingsModel>
}

// Add these interfaces to your existing prisma-types.ts file

export interface CouponModel {
  id: string
  code: string
  description: string
  type: CouponType
  value: Decimal
  startDate: Date
  endDate: Date
  usageLimit: number
  usageCount: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string
  specificClient: boolean
  clientIds: string | null
  minimumAmount: Decimal | null
  onePerCustomer: boolean
  newCustomersOnly: boolean
  usages?: CouponUsageModel[]
}

export interface CouponUsageModel {
  id: string
  couponId: string
  userId: string | null
  orderId: string | null
  amount: Decimal
  createdAt: Date
  coupon?: CouponModel
}

export enum CouponType {
  PERCENTAGE = "PERCENTAGE",
  FIXED_AMOUNT = "FIXED_AMOUNT",
  FREE_SERVICE = "FREE_SERVICE",
}

// Add these delegates to your ExtendedPrismaClient interface
export interface CouponDelegate {
  findMany: (args?: any) => Promise<CouponModel[]>
  findUnique: (args: { where: { id: string } | { code: string } }) => Promise<CouponModel | null>
  create: (args: { data: any }) => Promise<CouponModel>
  update: (args: { where: { id: string }; data: any }) => Promise<CouponModel>
  delete: (args: { where: { id: string } }) => Promise<CouponModel>
  upsert: (args: { where: any; create: any; update: any }) => Promise<CouponModel>
}

export interface CouponUsageDelegate {
  create: (args: { data: any }) => Promise<CouponUsageModel>
  findMany: (args?: any) => Promise<CouponUsageModel[]>
  count: (args?: any) => Promise<number>
}

// Then update your ExtendedPrismaClient type to include the user property
export type ExtendedPrismaClient = Omit<PrismaClient, "amendment"> & {
  amendment: AmendmentDelegate
  amendmentStatusHistory: AmendmentStatusHistoryDelegate
  annualReportDeadline: AnnualReportDeadlineDelegate
  annualReportFiling: AnnualReportFilingDelegate
  filingRequirement: FilingRequirementDelegate
  verificationToken: VerificationTokenDelegate
  // Add user model
  user: UserDelegate
  // Add document model
  document: DocumentDelegate
  // Add business model
  business: BusinessDelegate
  // Add community models
  post: PostDelegate
  comment: CommentDelegate
  like: LikeDelegate
  tag: TagDelegate
  postTag: PostTagDelegate
  // Add system settings model
  systemSettings: SystemSettingsDelegate
  // Add pricing settings model
  pricingSettings: PricingSettingsDelegate

  // Add affiliate delegates
  affiliateLink: AffiliateLinkDelegate
  affiliateClick: AffiliateClickDelegate
  affiliateConversion: AffiliateConversionDelegate
  affiliatePayout: AffiliatePayoutDelegate
  affiliateSettings: AffiliateSettingsDelegate
  // ... existing delegates
  coupon: CouponDelegate
  couponUsage: CouponUsageDelegate
  // Include raw query methods with proper typing
  $queryRaw: any // Using 'any' to avoid TypeScript errors
  $executeRaw: any // Using 'any' to avoid TypeScript errors
  $queryRawUnsafe: <T = any>(query: string, ...values: any[]) => Promise<T>
  $executeRawUnsafe: <T = any>(query: string, ...values: any[]) => Promise<T>
}

