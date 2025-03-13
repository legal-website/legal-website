// Store the IDs of invoices we've already seen to detect new ones
export const getLastSeenInvoices = (): string[] => {
    try {
      const stored = localStorage.getItem("lastSeenInvoices")
      return stored ? JSON.parse(stored) : []
    } catch (e) {
      console.error("Error retrieving last seen invoices:", e)
      return []
    }
  }
  
  export const updateLastSeenInvoices = (invoiceIds: string[]) => {
    try {
      localStorage.setItem("lastSeenInvoices", JSON.stringify(invoiceIds))
    } catch (e) {
      console.error("Error storing last seen invoices:", e)
    }
  }
  
  