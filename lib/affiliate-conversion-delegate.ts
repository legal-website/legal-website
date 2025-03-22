import type { AffiliateConversionModel } from "./prisma-types"

// Update the AffiliateConversionDelegate interface
export interface AffiliateConversionDelegate {
  findMany: (args?: any) => Promise<AffiliateConversionModel[]>
  findFirst: (args: { where: any; include?: any }) => Promise<AffiliateConversionModel | null>
  findUnique: (args: { where: any; include?: any }) => Promise<AffiliateConversionModel | null>
  create: (args: { data: any }) => Promise<AffiliateConversionModel>
  update: (args: { where: any; data: any }) => Promise<AffiliateConversionModel>
  count: (args?: any) => Promise<number>
}

