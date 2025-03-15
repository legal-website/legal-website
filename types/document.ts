export interface Document {
  id: string
  name: string
  description?: string | null
  category: string
  fileUrl: string
  fileType?: string
  type: string // This is the actual field in the database
  fileSize?: number
  status?: "Verified" | "Pending" | "Rejected"
  uploadDate?: string
  createdAt: Date
  lastModified?: string
  updatedAt: Date
  businessId: string
  uploadedByAdmin?: boolean
  sharedWith?: {
    email: string
    sharedAt: string
  }[]
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

