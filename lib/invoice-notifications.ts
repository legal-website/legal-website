import type { Notification } from "@/components/admin/header"

// Function to format time difference
export function formatTimeDifference(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return "Just now"
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} hour${hours > 1 ? "s" : ""} ago`
  } else {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} day${days > 1 ? "s" : ""} ago`
  }
}

// Invoice-related notification events
export const invoiceEvents = {
  invoiceCreated: (invoiceNumber: string, customerName: string): Omit<Notification, "id" | "time" | "read"> => ({
    title: "New Invoice Created",
    description: `Invoice #${invoiceNumber} created for ${customerName}`,
    source: "invoices",
  }),

  paymentReceived: (invoiceNumber: string, customerName: string): Omit<Notification, "id" | "time" | "read"> => ({
    title: "Payment Receipt Uploaded",
    description: `${customerName} uploaded payment receipt for invoice #${invoiceNumber}`,
    source: "invoices",
  }),

  paymentApproved: (invoiceNumber: string, customerName: string): Omit<Notification, "id" | "time" | "read"> => ({
    title: "Payment Approved",
    description: `Payment for invoice #${invoiceNumber} from ${customerName} has been approved`,
    source: "invoices",
  }),

  paymentRejected: (invoiceNumber: string, customerName: string): Omit<Notification, "id" | "time" | "read"> => ({
    title: "Payment Rejected",
    description: `Payment for invoice #${invoiceNumber} from ${customerName} has been rejected`,
    source: "invoices",
  }),

  invoiceDeleted: (invoiceNumber: string): Omit<Notification, "id" | "time" | "read"> => ({
    title: "Invoice Deleted",
    description: `Invoice #${invoiceNumber} has been deleted`,
    source: "invoices",
  }),

  invoiceStatusUpdated: (invoiceNumber: string, status: string): Omit<Notification, "id" | "time" | "read"> => ({
    title: "Invoice Status Updated",
    description: `Invoice #${invoiceNumber} status changed to ${status}`,
    source: "invoices",
  }),

  emailSent: (invoiceNumber: string, customerEmail: string): Omit<Notification, "id" | "time" | "read"> => ({
    title: "Invoice Email Sent",
    description: `Invoice #${invoiceNumber} sent to ${customerEmail}`,
    source: "invoices",
  }),
}

