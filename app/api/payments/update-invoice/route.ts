import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const { invoiceId, receiptUrl, affiliateCode } = await req.json()

    if (!invoiceId || !receiptUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log("Updating invoice with receipt:", invoiceId)
    console.log("Receipt URL:", receiptUrl)

    if (affiliateCode) {
      console.log("Affiliate code included:", affiliateCode)
    }

    // Get the invoice
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {
      paymentReceipt: receiptUrl,
    }

    // If we have an affiliate code and it's not already in the invoice fields,
    // add it to one of the fields
    if (affiliateCode) {
      let hasAffiliateCode = false

      // Check if the affiliate code is already in any of the fields
      if (invoice.customerCompany && invoice.customerCompany.includes(`ref:${affiliateCode}`)) {
        hasAffiliateCode = true
      } else if (invoice.customerAddress && invoice.customerAddress.includes(`ref:${affiliateCode}`)) {
        hasAffiliateCode = true
      } else if (invoice.customerCity && invoice.customerCity.includes(`ref:${affiliateCode}`)) {
        hasAffiliateCode = true
      }

      // If not, add it to one of the fields
      if (!hasAffiliateCode) {
        console.log("Adding affiliate code to invoice fields")

        if (!invoice.customerCompany) {
          updateData.customerCompany = `ref:${affiliateCode}`
        } else if (!invoice.customerAddress) {
          updateData.customerAddress = `ref:${affiliateCode}`
        } else if (!invoice.customerCity) {
          updateData.customerCity = `ref:${affiliateCode}`
        } else {
          // If all fields are filled, append to company
          updateData.customerCompany = `${invoice.customerCompany} (ref:${affiliateCode})`
        }
      }
    }

    // Update the invoice
    const updatedInvoice = await db.invoice.update({
      where: { id: invoiceId },
      data: updateData,
    })

    console.log("Invoice updated successfully")

    return NextResponse.json({ success: true, invoice: updatedInvoice })
  } catch (error: any) {
    console.error("Error updating invoice:", error)
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 })
  }
}

