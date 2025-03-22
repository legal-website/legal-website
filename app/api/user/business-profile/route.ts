import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import type { UserModel } from "@/lib/prisma-types"

// Define Business interface since it's not exported from prisma-types
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

// Define invoice interface for fetching additional data
interface Invoice {
  id: string
  invoiceNumber: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  customerCompany?: string
  customerAddress?: string
  customerCity?: string
  customerState?: string
  customerZip?: string
  customerCountry?: string
  amount: number
  status: string
  items: any
  createdAt: string
  updatedAt: string
  userId?: string
  isTemplateInvoice?: boolean
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

    // Use a more comprehensive query to fetch all user data including phone and address
    // This query joins User, Business, and PhoneNumberRequest tables
    const userQuery = `
      SELECT 
        u.*,
        b.*,
        p.phoneNumber,
        COALESCE(u.address, b.address) as userAddress
      FROM 
        User u
      LEFT JOIN 
        Business b ON u.businessId = b.id
      LEFT JOIN 
        PhoneNumberRequest p ON u.id = p.userId AND p.status = 'approved'
      WHERE 
        u.id = ?
    `

    const results = await db.$queryRawUnsafe(userQuery, session.user.id)
    console.log("Database query results:", JSON.stringify(results))

    const userData = results[0] as
      | (UserModel & Partial<BusinessData> & { phoneNumber?: string; userAddress?: string })
      | null

    if (!userData) {
      console.log("No user data found in database")
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("User data found:", {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      phone: userData.phoneNumber || userData.phone,
      address: userData.userAddress || userData.address,
    })

    // Extract business data from the results
    const businessData = userData.businessId
      ? {
          id: userData.businessId,
          name: userData.name,
          email: userData.email,
          phone: userData.phoneNumber || userData.phone,
          address: userData.userAddress || userData.address,
          website: userData.website,
          industry: userData.industry,
          formationDate: userData.formationDate,
          ein: userData.ein,
          businessId: userData.businessId,
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt,
        }
      : null

    console.log("Initial business data:", businessData)

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

    // Step 1: Fetch user invoices directly from the database
    console.log("Fetching invoices from database...")
    const invoicesQuery = `
      SELECT * FROM Invoice 
      WHERE userId = ? 
      ORDER BY createdAt DESC
    `

    const invoicesResults = await db.$queryRawUnsafe(invoicesQuery, session.user.id)
    console.log(`Found ${invoicesResults.length} invoices in database`)

    // Find template invoices that start with "inv"
    let relevantInvoice = null

    for (const invoice of invoicesResults) {
      console.log(`Checking invoice ${invoice.invoiceNumber}:`, {
        isTemplate: typeof invoice.items === "string" && invoice.items.toLowerCase().includes("template"),
        startsWithInv: invoice.invoiceNumber.toLowerCase().startsWith("inv"),
      })

      // Check if it's a template invoice that starts with "inv"
      const isTemplate = typeof invoice.items === "string" && invoice.items.toLowerCase().includes("template")
      const startsWithInv = invoice.invoiceNumber.toLowerCase().startsWith("inv")

      if (isTemplate && startsWithInv) {
        relevantInvoice = invoice
        console.log("Found relevant invoice:", invoice.invoiceNumber)
        break
      }
    }

    // Step 2: Fetch business data directly from the database
    console.log("Fetching dashboard business data...")
    const dashboardBusinessQuery = `
      SELECT * FROM Business 
      WHERE userId = ? OR id = ?
    `

    const dashboardBusinessResults = await db.$queryRawUnsafe(
      dashboardBusinessQuery,
      session.user.id,
      userData.businessId || "",
    )

    const dashboardBusinessData = dashboardBusinessResults[0] || null
    console.log("Dashboard business data:", dashboardBusinessData)

    // Step 3: Merge data from all sources
    // Create a merged business data object
    const mergedBusinessData = {
      // Start with the original business data
      ...businessData,

      // Override with dashboard data if available
      name: dashboardBusinessData?.name || businessData?.name || userData.name || "Your Business",
      formationDate: dashboardBusinessData?.formationDate || businessData?.formationDate,
      ein: dashboardBusinessData?.ein || businessData?.ein,
      businessId: dashboardBusinessData?.businessId || businessData?.businessId,

      // Override with invoice data if available
      email: relevantInvoice?.customerEmail || userData.email || "Not available",
      phone: relevantInvoice?.customerPhone || userData.phoneNumber || userData.phone || "Not available",
      address: formatInvoiceAddress(relevantInvoice) || userData.userAddress || userData.address || "Not available",

      // Keep other fields
      website: businessData?.website,
      industry: businessData?.industry,
      createdAt: businessData?.createdAt || new Date(),
      updatedAt: businessData?.updatedAt || new Date(),
    }

    console.log("Merged business data:", mergedBusinessData)

    // Return the merged business and user data
    const response = {
      business: mergedBusinessData
        ? {
            ...mergedBusinessData,
            serviceStatus: dashboardBusinessData?.serviceStatus || customData.serviceStatus,
            llcStatusMessage: dashboardBusinessData?.llcStatusMessage || customData.llcStatusMessage,
            llcProgress: dashboardBusinessData?.llcProgress || customData.llcProgress,
            annualReportFee: dashboardBusinessData?.annualReportFee || customData.annualReportFee,
            annualReportFrequency: dashboardBusinessData?.annualReportFrequency || customData.annualReportFrequency,
            displayIndustry: customData.displayIndustry,
          }
        : null,
      user: {
        id: userData.id,
        name: userData.name,
        email: relevantInvoice?.customerEmail || userData.email || "Not available",
        phone: relevantInvoice?.customerPhone || userData.phoneNumber || userData.phone || "Not available",
        address: formatInvoiceAddress(relevantInvoice) || userData.userAddress || userData.address || "Not available",
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
function formatInvoiceAddress(invoice: any): string | null {
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

    // Use a more comprehensive query to fetch all user data including phone and address
    const userQuery = `
      SELECT 
        u.*,
        b.*,
        p.phoneNumber,
        COALESCE(u.address, b.address) as userAddress
      FROM 
        User u
      LEFT JOIN 
        Business b ON u.businessId = b.id
      LEFT JOIN 
        PhoneNumberRequest p ON u.id = p.userId AND p.status = 'approved'
      WHERE 
        u.id = ?
    `

    const results = await db.$queryRawUnsafe(userQuery, session.user.id)
    const userData = results[0] as
      | (UserModel & Partial<BusinessData> & { phoneNumber?: string; userAddress?: string })
      | null

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update phone number through PhoneNumberRequest
    if (body.phone !== undefined) {
      console.log("Updating phone number:", body.phone)

      // Check if phone request exists
      const phoneRequest = await db.$queryRawUnsafe(
        `SELECT * FROM PhoneNumberRequest WHERE userId = ? AND status = 'approved'`,
        session.user.id,
      )

      if (phoneRequest && phoneRequest.length > 0) {
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

    // Update address if provided
    if (body.address !== undefined) {
      console.log("Updating address:", body.address)

      // Check if address column exists in User table
      const userColumns = await db.$queryRawUnsafe(`SHOW COLUMNS FROM User LIKE 'address'`)

      if (userColumns && userColumns.length > 0) {
        await db.$executeRawUnsafe(`UPDATE User SET address = ? WHERE id = ?`, body.address, session.user.id)
        console.log("Updated address in User table")
      } else {
        // If address doesn't exist in User table, update it in Business table if business exists
        if (userData.businessId) {
          await db.$executeRawUnsafe(`UPDATE Business SET address = ? WHERE id = ?`, body.address, userData.businessId)
          console.log("Updated address in Business table")
        }
      }
    }

    // Handle business information
    let businessId = userData.businessId
    console.log("Current business ID:", businessId)

    // Parse custom data from industry field
    let customData: BusinessCustomData = {
      serviceStatus: "Pending",
      llcStatusMessage: "LLC formation initiated",
      llcProgress: 10,
      annualReportFee: 100,
      annualReportFrequency: 1,
    }

    if (userData.industry) {
      try {
        const parsedData = JSON.parse(userData.industry as string)
        customData = { ...customData, ...parsedData }
      } catch (e) {
        console.error("Error parsing custom data:", e)
      }
    }

    // Update industry with custom data if needed
    let updatedIndustry = userData.industry

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
          userId,
          createdAt, 
          updatedAt
        ) 
        VALUES (
          UUID(), 
          ?, 
          ?, 
          ?, 
          ?,
          ?,
          NOW(), 
          NOW()
        )
        RETURNING id
      `

      const newBusiness = await db.$executeRawUnsafe(
        newBusinessQuery,
        body.name || userData.name || "My Business",
        body.website || "",
        updatedIndustry || JSON.stringify(customData),
        body.address || userData.userAddress || "",
        session.user.id,
      )

      businessId = newBusiness[0].id
      console.log("New business created with ID:", businessId)

      // Update user with business ID
      await db.$executeRawUnsafe(`UPDATE User SET businessId = ? WHERE id = ?`, businessId, session.user.id)
      console.log("Updated user with new business ID")
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

      // Ensure the business is linked to the user
      updateFields.push("userId = ?")
      params.push(session.user.id)

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

    // Get the updated user and business data
    const updatedResults = await db.$queryRawUnsafe(userQuery, session.user.id)
    const updatedUserData = updatedResults[0] as
      | (UserModel & Partial<BusinessData> & { phoneNumber?: string; userAddress?: string })
      | null

    if (!updatedUserData) {
      throw new Error("Failed to retrieve updated user")
    }

    // Step 1: Fetch user invoices directly from the database
    console.log("Fetching invoices from database...")
    const invoicesQuery = `
      SELECT * FROM Invoice 
      WHERE userId = ? 
      ORDER BY createdAt DESC
    `

    const invoicesResults = await db.$queryRawUnsafe(invoicesQuery, session.user.id)
    console.log(`Found ${invoicesResults.length} invoices in database`)

    // Find template invoices that start with "inv"
    let relevantInvoice = null

    for (const invoice of invoicesResults) {
      // Check if it's a template invoice that starts with "inv"
      const isTemplate = typeof invoice.items === "string" && invoice.items.toLowerCase().includes("template")
      const startsWithInv = invoice.invoiceNumber.toLowerCase().startsWith("inv")

      if (isTemplate && startsWithInv) {
        relevantInvoice = invoice
        console.log("Found relevant invoice:", invoice.invoiceNumber)
        break
      }
    }

    // Step 2: Fetch business data directly from the database
    console.log("Fetching dashboard business data...")
    const dashboardBusinessQuery = `
      SELECT * FROM Business 
      WHERE userId = ? OR id = ?
    `

    const dashboardBusinessResults = await db.$queryRawUnsafe(
      dashboardBusinessQuery,
      session.user.id,
      updatedUserData.businessId || "",
    )

    const dashboardBusinessData = dashboardBusinessResults[0] || null

    // Extract updated business data
    const updatedBusinessData = updatedUserData.businessId
      ? {
          id: updatedUserData.businessId,
          name: updatedUserData.name,
          email: updatedUserData.email,
          phone: updatedUserData.phoneNumber || updatedUserData.phone,
          address: updatedUserData.userAddress || updatedUserData.address,
          website: updatedUserData.website,
          industry: updatedUserData.industry,
          formationDate: updatedUserData.formationDate,
          ein: updatedUserData.ein,
          businessId: updatedUserData.businessId,
          createdAt: updatedUserData.createdAt,
          updatedAt: updatedUserData.updatedAt,
        }
      : null

    // Merge with data from other sources
    const mergedBusinessData = {
      ...updatedBusinessData,

      // Override with dashboard data if available
      name:
        body.name ||
        dashboardBusinessData?.name ||
        updatedBusinessData?.name ||
        updatedUserData.name ||
        "Your Business",
      formationDate: dashboardBusinessData?.formationDate || updatedBusinessData?.formationDate,
      ein: dashboardBusinessData?.ein || updatedBusinessData?.ein,
      businessId: dashboardBusinessData?.businessId || updatedBusinessData?.businessId,

      // Override with invoice data if available (but only if not explicitly updated in this request)
      email:
        body.email !== undefined
          ? body.email
          : relevantInvoice?.customerEmail || updatedBusinessData?.email || updatedUserData.email || "Not available",
      phone:
        body.phone !== undefined
          ? body.phone
          : relevantInvoice?.customerPhone ||
            updatedBusinessData?.phone ||
            updatedUserData.phoneNumber ||
            "Not available",
      address:
        body.address !== undefined
          ? body.address
          : formatInvoiceAddress(relevantInvoice) ||
            updatedBusinessData?.address ||
            updatedUserData.userAddress ||
            "Not available",
    }

    console.log("Final merged business data:", mergedBusinessData)

    return NextResponse.json({
      success: true,
      business: mergedBusinessData
        ? {
            ...mergedBusinessData,
            serviceStatus: dashboardBusinessData?.serviceStatus || customData.serviceStatus,
            llcStatusMessage: dashboardBusinessData?.llcStatusMessage || customData.llcStatusMessage,
            llcProgress: dashboardBusinessData?.llcProgress || customData.llcProgress,
            annualReportFee: dashboardBusinessData?.annualReportFee || customData.annualReportFee,
            annualReportFrequency: dashboardBusinessData?.annualReportFrequency || customData.annualReportFrequency,
            displayIndustry: customData.displayIndustry || body.industry,
          }
        : null,
      user: {
        id: updatedUserData.id,
        name: updatedUserData.name,
        email: body.email || relevantInvoice?.customerEmail || updatedUserData.email || "Not available",
        phone: body.phone || relevantInvoice?.customerPhone || updatedUserData.phoneNumber || "Not available",
        address:
          body.address || formatInvoiceAddress(relevantInvoice) || updatedUserData.userAddress || "Not available",
      },
    })
  } catch (error) {
    console.error("Error updating business profile:", error)
    return NextResponse.json({ error: "Failed to update business profile" }, { status: 500 })
  }
}

