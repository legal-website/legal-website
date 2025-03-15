export interface Document {
  id: string
  name: string
  category: string
  createdAt: Date
  updatedAt: Date
  businessId: string
  fileUrl: string
  type: string
}

export interface StorageInfo {
  used: number
  limit: number
  percentage: number
}

export interface DocumentActivity {
  text: string
  time: string
}

