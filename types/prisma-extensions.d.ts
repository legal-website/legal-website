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
    // Add your custom types here if needed
  }
}

declare module "@prisma/client" {
  interface PrismaClient {
    documentActivity: any
    documentSharing: any
    businessStorage: any
    notification: any
  }

  // Add missing Document properties
  interface Document {
    size: string
    isPermanent: boolean
    description?: string | null
    uploadedById: string
  }

  // Add Notification model
  interface Notification {
    id: string
    title: string
    message: string
    type: string
    read: boolean
    link?: string | null
    userId: string
    createdAt: Date
    updatedAt: Date
  }
}
declare module "@/lib/prisma-types" {
  interface CommentModel {
    isBestAnswer?: boolean
    moderationNotes?: string | null
  }
}