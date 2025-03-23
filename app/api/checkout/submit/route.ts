import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const {
      name,
      email,
      phone,
      company,
      address,
      city,
      state,
      zip,
      country,
      notes,
      amount,
      packageName,
      affiliateCode,
    } = data

    console.log("Checkout data received:", JSON.stringify(data, null, 2))

    if (!email || !name || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}`

    // Ensure we have the affiliate code in one of the fields
    let customerCompany = company || ""
    let customerAddress = address || ""
    let customerCity = city || ""

    // Double-check if we need to add the affiliate code
    if (
      affiliateCode &&
      !customerCompany.includes(`ref:${affiliateCode}`) &&
      !customerAddress.includes(`ref:${affiliateCode}`) &&
      !customerCity.includes(`ref:${affiliateCode}`)
    ) {
      console.log("Adding affiliate code to invoice fields:", affiliateCode)

      // Add the affiliate code to the first available field
      if (!customerCompany) {
        customerCompany = `ref:${affiliateCode}`
      } else if (!customerAddress) {
        customerAddress = `ref:${affiliateCode}`
      } else if (!customerCity) {
        customerCity = `ref:${affiliateCode}`
      } else {
        // If all fields are filled, append to company
        customerCompany = `${customerCompany} (ref:${affiliateCode})`
      }
    }

    console.log("Final invoice fields:")
    console.log("Company:", customerCompany)
    console.log("Address:", customerAddress)
    console.log("City:", customerCity)

    // Create invoice with all fields
    const invoice = await db.invoice.create({
      data: {
        invoiceNumber,
        customerName: name,
        customerEmail: email,
        customerPhone: phone || null,
        customerCompany,
        customerAddress,
        customerCity,
        customerState: state || null,
        customerZip: zip || null,
        customerCountry: country || null,
        amount: Number.parseFloat(amount.toString()),
        status: "pending",
        items: JSON.stringify([
          {
            name: packageName || "Service Package",
            price: Number.parseFloat(amount.toString()),
            quantity: 1,
          },
        ]),
      },
    })

    console.log("Invoice created:", invoice.id)

    return NextResponse.json({
      success: true,
      invoiceId: invoice.id,
      invoice,
      message: "Invoice created successfully. Please upload payment receipt.",
    })
  } catch (error: any) {
    console.error("Error processing checkout:", error)
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 })
  }
}

