export interface PaymentMethod {
  id: string
  type: "bank" | "mobile_wallet"
  name: string
  accountTitle: string
  accountNumber: string
  iban?: string | null
  swiftCode?: string | null
  branchName?: string | null
  branchCode?: string | null
  bankName?: string | null
  providerName?: string | null
  isActive: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface PaymentMethodFormData {
  type: "bank" | "mobile_wallet"
  name: string
  accountTitle: string
  accountNumber: string
  iban?: string
  swiftCode?: string
  branchName?: string
  branchCode?: string
  bankName?: string
  providerName?: string
  isActive: boolean
}

