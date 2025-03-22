import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// Define our own interfaces instead of relying on prisma-types.ts
interface UserData {
  id: string
  name: string | null
  email: string
  role: string
  businessId: string | null
  image?: string | null
  [key: string]: any // Allow for additional properties
}

interface BusinessData {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  website: string | null
  industry: string | null
  formationDate: Date | null
  ein: string | null
  businessId: string | null
  createdAt: Date
  updatedAt: Date
  [key: string]: any // Allow for additional properties
}

interface PhoneData {
  id: string
  userId: string
  phoneNumber: string | null
  status: string
  createdAt: Date
  updatedAt: Date
  [key: string]: any // Allow for additional properties
}

interface InvoiceData {
  id: string
  invoiceNumber: string
  customerName: string
  customerEmail: string
  customerPhone?: string | null
  customerAddress?: string | null
  customerCity?: string | null
  customerState?: string | null
  customerZip?: string | null
  customerCountry?: string | null
  items: string
  [key: string]: any // Allow for additional properties
}

// Define custom data interface for industry field
interface BusinessCustomData {
  serviceStatus: string
  llcStatusMessage: string
  llcProgress: number
  annualReportFee: number
  annualReportFrequency: number
  displayIndustry?: string
}

export async function GET(req: NextRequest) {
  try {
    console.log("Business profile GET request started")

    // Get the current user session
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      console.log("No user session found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("User session found for ID:", session.user.id)

    // Get basic user data
    const userQuery = `
      SELECT * FROM User WHERE id = ?
    `
    const userResults = await db.$queryRawUnsafe(userQuery, session.user.id)
    const userData = userResults[0] as UserData | null

    if (!userData) {
      console.log("No user data found in database")
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("User data found:", {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      businessId: userData.businessId,
    })

    // Get business data if available
    let businessData = null
    if (userData.businessId) {
      const businessQuery = `
        SELECT * FROM Business WHERE id = ?
      `
      const businessResults = await db.$queryRawUnsafe(businessQuery, userData.businessId)
      if (businessResults && businessResults.length > 0) {
        businessData = businessResults[0] as BusinessData
        console.log("Business data found:", businessData)
      }
    }

    // Get phone number data if available
    let phoneData = null
    const phoneQuery = `
      SELECT * FROM PhoneNumberRequest WHERE userId = ? AND status = 'approved'
    `
    const phoneResults = await db.$queryRawUnsafe(phoneQuery, session.user.id)
    if (phoneResults && phoneResults.length > 0) {
      phoneData = phoneResults[0] as PhoneData
      console.log("Phone data found:", phoneData)
    }

    // Get invoice data for additional information
    const invoiceQuery = `
      SELECT * FROM Invoice WHERE userId = ? ORDER BY createdAt DESC
    `
    const invoiceResults = await db.$queryRawUnsafe(invoiceQuery, session.user.id)
    console.log(`Found ${invoiceResults.length} invoices in database`)

    // Find template invoices that start with "inv"
    let relevantInvoice = null
    for (const invoice of invoiceResults) {
      const invoiceData = invoice as InvoiceData
      // Check if it's a template invoice that starts with "inv"
      const isTemplate = typeof invoiceData.items === "string" && invoiceData.items.toLowerCase().includes("template")
      const startsWithInv = invoiceData.invoiceNumber.toLowerCase().startsWith("inv")

      if (isTemplate && startsWithInv) {
        relevantInvoice = invoiceData
        console.log("Found relevant invoice:", invoiceData.invoiceNumber)
        break
      }
    }

    // Parse custom data from industry field
    let customData: BusinessCustomData = {
      serviceStatus: "Pending",
      llcStatusMessage: "LLC formation initiated",
      llcProgress: 10,
      annualReportFee: 100,
      annualReportFrequency: 1,
    }

    if (businessData?.industry) {
      try {
        const parsedData = JSON.parse(businessData.industry as string)
        customData = { ...customData, ...parsedData }
        console.log("Parsed custom data from industry field:", customData)
      } catch (e) {
        console.error("Error parsing custom data:", e)
      }
    }

    // Get business data from dashboard if available
    let dashboardBusinessData = null
    try {
      // Try to get business data from dashboard
      const dashboardQuery = `
        SELECT * FROM Business WHERE userId = ? OR id = ?
      `
      const dashboardResults = await db.$queryRawUnsafe(dashboardQuery, session.user.id, userData.businessId || "")

      if (dashboardResults && dashboardResults.length > 0) {
        dashboardBusinessData = dashboardResults[0] as BusinessData
        console.log("Dashboard business data found:", dashboardBusinessData)
      }
    } catch (error) {
      console.error("Error fetching dashboard business data:", error)
    }

    // Merge data from all sources
    const mergedBusinessData = {
      // Start with the original business data
      ...(businessData || {}),

      // Override with dashboard data if available
      name: dashboardBusinessData?.name || businessData?.name || userData.name || "Your Business",
      formationDate: dashboardBusinessData?.formationDate || businessData?.formationDate,
      ein: dashboardBusinessData?.ein || businessData?.ein,

      // Override with invoice data if available
      email: relevantInvoice?.customerEmail || businessData?.email || userData.email,
      phone: phoneData?.phoneNumber || relevantInvoice?.customerPhone || businessData?.phone || "Not available",
      address: formatInvoiceAddress(relevantInvoice) || businessData?.address || "Not available",

      // Keep other fields
      website: businessData?.website || "Not available",
      industry: businessData?.industry,
      id: businessData?.id || dashboardBusinessData?.id,
      businessId: userData.businessId,
      createdAt: businessData?.createdAt || new Date(),
      updatedAt: businessData?.updatedAt || new Date(),
    }

    console.log("Merged business data:", mergedBusinessData)

    // Return the merged business and user data
    const response = {
      business: {
        ...mergedBusinessData,
        serviceStatus: customData.serviceStatus,
        llcStatusMessage: customData.llcStatusMessage,
        llcProgress: customData.llcProgress,
        annualReportFee: customData.annualReportFee,
        annualReportFrequency: customData.annualReportFrequency,
        displayIndustry: customData.displayIndustry,
      },
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        phone: phoneData?.phoneNumber || relevantInvoice?.customerPhone || "Not available",
        address: formatInvoiceAddress(relevantInvoice) || businessData?.address || "Not available",
      },
    }

    console.log("Final response:", response)
    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching business profile:", error)
    return NextResponse.json({ error: "Failed to fetch business profile" }, { status: 500 })
  }
}

// Helper function to format address from invoice data
function formatInvoiceAddress(invoice: InvoiceData | null): string | null {
  if (!invoice) return null

  const parts = []

  if (invoice.customerAddress) parts.push(invoice.customerAddress)

  let cityStateZip = ""
  if (invoice.customerCity) cityStateZip += invoice.customerCity
  if (invoice.customerState) cityStateZip += cityStateZip ? `, ${invoice.customerState}` : invoice.customerState
  if (invoice.customerZip) cityStateZip += cityStateZip ? ` ${invoice.customerZip}` : invoice.customerZip

  if (cityStateZip) parts.push(cityStateZip)
  if (invoice.customerCountry) parts.push(invoice.customerCountry)

  return parts.length > 0 ? parts.join(", ") : null
}

export async function PUT(req: NextRequest) {
  try {
    console.log("Business profile PUT request started")

    // Get the current user session
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse the request body
    const body = await req.json()
    console.log("Request body:", body)

    // Get user data
    const userQuery = `
      SELECT * FROM User WHERE id = ?
    `
    const userResults = await db.$queryRawUnsafe(userQuery, session.user.id)
    const userData = userResults[0] as UserData | null

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get business data if available
    let businessData = null
    if (userData.businessId) {
      const businessQuery = `
        SELECT * FROM Business WHERE id = ?
      `
      const businessResults = await db.$queryRawUnsafe(businessQuery, userData.businessId)
      if (businessResults && businessResults.length > 0) {
        businessData = businessResults[0] as BusinessData
      }
    }

    // Update phone number through PhoneNumberRequest
    if (body.phone !== undefined) {
      console.log("Updating phone number:", body.phone)

      // Check if phone request exists
      const phoneQuery = `
        SELECT * FROM PhoneNumberRequest WHERE userId = ? AND status = 'approved'
      `
      const phoneResults = await db.$queryRawUnsafe(phoneQuery, session.user.id)

      if (phoneResults && phoneResults.length > 0) {
        // Update existing phone request
        await db.$executeRawUnsafe(
          `UPDATE PhoneNumberRequest SET phoneNumber = ?, updatedAt = NOW() WHERE userId = ? AND status = 'approved'`,
          body.phone,
          session.user.id,
        )
        console.log("Updated existing phone request")
      } else {
        // Create new phone request
        await db.$executeRawUnsafe(
          `INSERT INTO PhoneNumberRequest (id, userId, phoneNumber, status, createdAt, updatedAt) 
           VALUES (UUID(), ?, ?, 'approved', NOW(), NOW())`,
          session.user.id,
          body.phone,
        )
        console.log("Created new phone request")
      }
    }

    // Parse custom data from industry field
    let customData: BusinessCustomData = {
      serviceStatus: "Pending",
      llcStatusMessage: "LLC formation initiated",
      llcProgress: 10,
      annualReportFee: 100,
      annualReportFrequency: 1,
    }

    if (businessData?.industry) {
      try {
        const parsedData = JSON.parse(businessData.industry as string)
        customData = { ...customData, ...parsedData }
      } catch (e) {
        console.error("Error parsing custom data:", e)
      }
    }

    // Update industry with custom data if needed
    let updatedIndustry = businessData?.industry

    if (body.industry !== undefined) {
      console.log("Updating industry:", body.industry)

      // If the industry is a valid JSON, we'll keep it as is
      // Otherwise, we'll update the customData and stringify it
      try {
        JSON.parse(body.industry)
        updatedIndustry = body.industry
      } catch (e) {
        // Not valid JSON, so we'll use it as the display industry
        customData.displayIndustry = body.industry
        updatedIndustry = JSON.stringify(customData)
      }
    }

    // Create or update business
    let businessId = userData.businessId
    console.log("Current business ID:", businessId)

    if (!businessId) {
      console.log("Creating new business")

      // Create a new business
      const newBusinessQuery = `
        INSERT INTO Business (
          id, 
          name, 
          website, 
          industry, 
          address,
          createdAt, 
          updatedAt
        ) 
        VALUES (
          UUID(), 
          ?, 
          ?, 
          ?, 
          ?,
          NOW(), 
          NOW()
        )
      `

      await db.$executeRawUnsafe(
        newBusinessQuery,
        body.name || userData.name || "My Business",
        body.website || "",
        updatedIndustry || JSON.stringify(customData),
        body.address || "",
      )

      // Get the newly created business ID
      const newBusinessIdQuery = `
        SELECT id FROM Business 
        WHERE name = ? 
        ORDER BY createdAt DESC 
        LIMIT 1
      `
      const newBusinessResults = await db.$queryRawUnsafe(
        newBusinessIdQuery,
        body.name || userData.name || "My Business",
      )

      if (newBusinessResults && newBusinessResults.length > 0) {
        businessId = newBusinessResults[0].id
        console.log("New business created with ID:", businessId)

        // Update user with business ID
        await db.$executeRawUnsafe(`UPDATE User SET businessId = ? WHERE id = ?`, businessId, session.user.id)
        console.log("Updated user with new business ID")
      }
    } else {
      console.log("Updating existing business")

      // Update the existing business
      const updateFields = []
      const params = []

      if (body.name !== undefined) {
        updateFields.push("name = ?")
        params.push(body.name)
      }

      if (body.website !== undefined) {
        updateFields.push("website = ?")
        params.push(body.website)
      }

      if (updatedIndustry !== undefined) {
        updateFields.push("industry = ?")
        params.push(updatedIndustry)
      }

      if (body.address !== undefined) {
        updateFields.push("address = ?")
        params.push(body.address)
      }

      if (updateFields.length > 0) {
        const updateQuery = `
          UPDATE Business 
          SET ${updateFields.join(", ")}, updatedAt = NOW()
          WHERE id = ?
        `

        params.push(businessId)
        await db.$executeRawUnsafe(updateQuery, ...params)
        console.log("Business updated successfully")
      }
    }

    // Get updated user data
    const updatedUserQuery = `
      SELECT * FROM User WHERE id = ?
    `
    const updatedUserResults = await db.$queryRawUnsafe(updatedUserQuery, session.user.id)
    const updatedUserData = updatedUserResults[0] as UserData | null

    if (!updatedUserData) {
      throw new Error("Failed to retrieve updated user")
    }

    // Get updated business data
    let updatedBusinessData = null
    if (updatedUserData.businessId) {
      const updatedBusinessQuery = `
        SELECT * FROM Business WHERE id = ?
      `
      const updatedBusinessResults = await db.$queryRawUnsafe(updatedBusinessQuery, updatedUserData.businessId)
      if (updatedBusinessResults && updatedBusinessResults.length > 0) {
        updatedBusinessData = updatedBusinessResults[0] as BusinessData
      }
    }

    // Get updated phone data
    let updatedPhoneData = null
    const updatedPhoneQuery = `
      SELECT * FROM PhoneNumberRequest WHERE userId = ? AND status = 'approved'
    `
    const updatedPhoneResults = await db.$queryRawUnsafe(updatedPhoneQuery, session.user.id)
    if (updatedPhoneResults && updatedPhoneResults.length > 0) {
      updatedPhoneData = updatedPhoneResults[0] as PhoneData
    }

    // Get invoice data for additional information
    const invoiceQuery = `
      SELECT * FROM Invoice WHERE userId = ? ORDER BY createdAt DESC
    `
    const invoiceResults = await db.$queryRawUnsafe(invoiceQuery, session.user.id)

    // Find template invoices that start with "inv"
    let relevantInvoice = null
    for (const invoice of invoiceResults) {
      const invoiceData = invoice as InvoiceData
      // Check if it's a template invoice that starts with "inv"
      const isTemplate = typeof invoiceData.items === "string" && invoiceData.items.toLowerCase().includes("template")
      const startsWithInv = invoiceData.invoiceNumber.toLowerCase().startsWith("inv")

      if (isTemplate && startsWithInv) {
        relevantInvoice = invoiceData
        break
      }
    }

    // Merge with data from other sources
    const mergedBusinessData = {
      ...(updatedBusinessData || {}),

      // Override with user-provided data
      name: body.name || updatedBusinessData?.name || updatedUserData.name || "Your Business",

      // Override with invoice data if available (but only if not explicitly updated in this request)
      email:
        body.email !== undefined
          ? body.email
          : relevantInvoice?.customerEmail || updatedBusinessData?.email || updatedUserData.email,
      phone:
        body.phone !== undefined
          ? body.phone
          : updatedPhoneData?.phoneNumber ||
            relevantInvoice?.customerPhone ||
            updatedBusinessData?.phone ||
            "Not available",
      address:
        body.address !== undefined
          ? body.address
          : formatInvoiceAddress(relevantInvoice) || updatedBusinessData?.address || "Not available",

      // Keep other fields
      website: body.website !== undefined ? body.website : updatedBusinessData?.website || "Not available",
      industry: updatedBusinessData?.industry,
      formationDate: updatedBusinessData?.formationDate,
      ein: updatedBusinessData?.ein,
      id: updatedBusinessData?.id,
      businessId: updatedUserData.businessId,
      createdAt: updatedBusinessData?.createdAt || new Date(),
      updatedAt: updatedBusinessData?.updatedAt || new Date(),
    }

    return NextResponse.json({
      success: true,
      business: {
        ...mergedBusinessData,
        serviceStatus: customData.serviceStatus,
        llcStatusMessage: customData.llcStatusMessage,
        llcProgress: customData.llcProgress,
        annualReportFee: customData.annualReportFee,
        annualReportFrequency: customData.annualReportFrequency,
        displayIndustry: customData.displayIndustry || body.industry,
      },
      user: {
        id: updatedUserData.id,
        name: updatedUserData.name,
        email: updatedUserData.email,
        phone: body.phone || updatedPhoneData?.phoneNumber || relevantInvoice?.customerPhone || "Not available",
        address:
          body.address || formatInvoiceAddress(relevantInvoice) || updatedBusinessData?.address || "Not available",
      },
    })
  } catch (error) {
    console.error("Error updating business profile:", error)
    return NextResponse.json({ error: "Failed to update business profile" }, { status: 500 })
  }
}

