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
  }

  // Add missing Document properties
  interface Document {
    size: string
    isPermanent: boolean
    description?: string | null
    uploadedById: string
  }
}

