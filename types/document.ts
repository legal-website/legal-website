export interface Document {
  id: string
  name: string
  type: string
  category: string
  description?: string
  businessId: string
  createdAt: Date | string
  updatedAt: Date | string
  url?: string
}

export interface StorageInfo {
  used: number
  limit: number
  percentage: number
}

