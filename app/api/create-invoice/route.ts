import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { v4 as uuidv4 } from "uuid"

// Define an interface for the invoice item to avoid TypeScript errors
interface InvoiceItem {
  id: string
  tier: string
  price: number
  stateFee: number | null
  state: string | null
  discount: number | null
  templateId: string | null
  type: string | null
  name: string
  description: string | null
  isTemplateInvoice?: boolean // Make this optional
}

export async function POST(req: Request) {
  try {
    // Parse request body
    let body
    try {
      body = await req.json()
      console.log("Creating invoice with data:", JSON.stringify(body, null, 2))
    } catch (parseError) {
      console.error("Error parsing request body:", parseError)
      return NextResponse.json(
        { error: "Invalid request data", message: "Could not parse the request body" },
        { status: 400 },
      )
    }

    const { customer, items, total, paymentReceipt, affiliateCode, couponCode } = body

    // Validate required fields
    if (!paymentReceipt) {
      return NextResponse.json({ error: "Payment receipt is required" }, { status: 400 })
    }

    if (!customer || !customer.name || !customer.email) {
      return NextResponse.json({ error: "Customer information is required" }, { status: 400 })
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Items are required" }, { status: 400 })
    }

    if (total === undefined || total === null) {
      return NextResponse.json({ error: "Total amount is required" }, { status: 400 })
    }

    // Generate invoice number
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const invoiceNumber = `INV-${year}${month}-${Math.floor(1000 + Math.random() * 9000)}`

    // Process items to ensure they're in the correct format
    // IMPORTANT: Preserve the original price from the items
    const safeItems: InvoiceItem[] = items.map((item: any) => ({
      id: item.id || `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tier: item.tier || "STANDARD",
      price: Number(item.price) || 0, // Ensure we're using the actual price from the item
      stateFee: item.stateFee ? Number(item.stateFee) : null,
      state: item.state || null,
      discount: item.discount ? Number(item.discount) : null,
      templateId: item.templateId || null, // Add templateId if it exists
      type: item.templateId ? "template" : item.type || null, // Set type to "template" if templateId exists
      name: item.name || item.tier || "Unknown Item", // Add item name for better identification
      description: item.description || null, // Add description if available
    }))

    // Check if this is a template invoice
    const isTemplateInvoice = safeItems.some(
      (item) =>
        item.type === "template" ||
        (item.tier && typeof item.tier === "string" && item.tier.toLowerCase().includes("template")),
    )

    // If this is a template invoice, add a flag to make it easier to identify
    if (isTemplateInvoice) {
      console.log("This is a template invoice")
      // Add isTemplateInvoice flag to each item that is a template
      safeItems.forEach((item) => {
        if (
          item.type === "template" ||
          (item.tier && typeof item.tier === "string" && item.tier.toLowerCase().includes("template"))
        ) {
          item.isTemplateInvoice = true
        }
      })
    }

    // Convert amount to a number - use the provided total which should match the template price
    const amount = typeof total === "string" ? Number.parseFloat(total) : Number(total)

    // Handle affiliate code - ensure it's stored in one of the customer fields
    let customerCompany = customer.company || ""
    let customerAddress = customer.address || ""
    let customerCity = customer.city || ""

    // If we have an affiliate code and it's not already in one of the fields, add it
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

      console.log("Updated fields with affiliate code:")
      console.log("Company:", customerCompany)
      console.log("Address:", customerAddress)
      console.log("City:", customerCity)
    } else if (affiliateCode) {
      console.log("Affiliate code already present in customer data:", affiliateCode)
    }

    // Handle coupon code - store it in a field if provided
    if (couponCode) {
      console.log("Adding coupon code to invoice fields:", couponCode)

      // Add the coupon code to the first available field or append to an existing one
      if (!customerCompany) {
        customerCompany = `coupon:${couponCode}`
      } else if (!customerAddress) {
        customerAddress = `coupon:${couponCode}`
      } else if (!customerCity) {
        customerCity = `coupon:${couponCode}`
      } else {
        // If all fields are filled, append to company
        customerCompany = `${customerCompany} (coupon:${couponCode})`
      }

      console.log("Updated fields with coupon code:")
      console.log("Company:", customerCompany)
      console.log("Address:", customerAddress)
      console.log("City:", customerCity)
    }

    // Create the invoice using raw SQL to avoid TypeScript errors
    const invoiceId = uuidv4()
    const now = new Date().toISOString().slice(0, 19).replace("T", " ")

    const invoiceNumber2 = isTemplateInvoice ? `TEMPLATE-${invoiceNumber}` : invoiceNumber
    const itemsJson = JSON.stringify(safeItems)

    await db.$executeRaw`
      INSERT INTO Invoice (
        id, invoiceNumber, customerName, customerEmail, customerPhone, 
        customerCompany, customerAddress, customerCity, customerState,
        customerZip, customerCountry, amount, status, items, paymentReceipt,
        createdAt, updatedAt
      ) VALUES (
        ${invoiceId}, ${invoiceNumber2}, ${customer.name}, ${customer.email}, ${customer.phone || null},
        ${customerCompany || null}, ${customerAddress || null}, ${customerCity || null}, ${customer.state || null},
        ${customer.zip || null}, ${customer.country || null}, ${amount}, 'pending', ${itemsJson}, ${paymentReceipt},
        NOW(), NOW()
      )
    `

    console.log("Invoice created successfully:", invoiceId)

    // If coupon code was provided, track its usage
    if (couponCode) {
      try {
        console.log(`Processing coupon usage for code: ${couponCode}`)

        // Find the coupon
        const couponResult = (await db.$queryRaw`
          SELECT * FROM Coupon WHERE code = ${couponCode}
        `) as any[]

        if (couponResult && couponResult.length > 0) {
          const coupon = couponResult[0]
          console.log("Found coupon:", coupon)

          // Check if usage already exists for this invoice
          const existingUsageResult = (await db.$queryRaw`
            SELECT * FROM CouponUsage WHERE orderId = ${invoiceId}
          `) as any[]

          if (!existingUsageResult || existingUsageResult.length === 0) {
            // Create usage record
            const usageId = uuidv4()
            await db.$executeRaw`
              INSERT INTO CouponUsage (id, couponId, userId, orderId, amount, createdAt)
              VALUES (${usageId}, ${coupon.id}, ${null}, ${invoiceId}, ${amount || 0}, NOW())
            `

            console.log("Created coupon usage record:", usageId)

            // Update coupon usage count
            await db.$executeRaw`
              UPDATE Coupon 
              SET usageCount = usageCount + 1 
              WHERE id = ${coupon.id}
            `

            console.log("Updated coupon usage count")
          } else {
            console.log("Coupon usage already exists for this invoice:", existingUsageResult[0])
          }
        } else {
          console.log(`Coupon with code ${couponCode} not found`)
        }
      } catch (error) {
        console.error("Error tracking coupon usage:", error)
        // Continue with the process even if coupon tracking fails
      }
    }

    // Fetch the created invoice to return it
    const invoiceResult = (await db.$queryRaw`
      SELECT * FROM Invoice WHERE id = ${invoiceId}
    `) as any[]

    if (!invoiceResult || invoiceResult.length === 0) {
      throw new Error("Failed to retrieve created invoice")
    }

    const invoice = invoiceResult[0]

    return NextResponse.json({
      success: true,
      invoice,
    })
  } catch (error: any) {
    console.error("Error creating invoice:", error)
    return NextResponse.json(
      {
        error: "Failed to create invoice",
        message: error.message,
        code: error.code,
        meta: error.meta,
      },
      { status: 500 },
    )
  }
}

