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
    // Get the current user session
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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
    const userData = results[0] as
      | (UserModel & Partial<BusinessData> & { phoneNumber?: string; userAddress?: string })
      | null

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

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

    // Step 1: Fetch additional business data from /api/user/business
    // This is the same endpoint used by dashboard/page.tsx
    let dashboardBusinessData = null
    try {
      const businessResponse = await fetch(`${req.nextUrl.origin}/api/user/business`, {
        headers: {
          cookie: req.headers.get("cookie") || "",
        },
      })

      if (businessResponse.ok) {
        const businessResult = await businessResponse.json()
        if (businessResult.business) {
          dashboardBusinessData = businessResult.business
          console.log("Fetched dashboard business data:", dashboardBusinessData)
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard business data:", error)
    }

    // Step 2: Fetch invoice data to get additional user information
    // This is similar to what's done in admin/billing/invoices/page.tsx
    let invoiceData = null
    try {
      // First try admin endpoint
      let invoicesResponse = await fetch(`${req.nextUrl.origin}/api/admin/invoices`, {
        headers: {
          cookie: req.headers.get("cookie") || "",
        },
      })

      // If admin endpoint fails (e.g., not an admin), try user-specific endpoint
      if (!invoicesResponse.ok) {
        invoicesResponse = await fetch(`${req.nextUrl.origin}/api/user/invoices`, {
          headers: {
            cookie: req.headers.get("cookie") || "",
          },
        })
      }

      if (invoicesResponse.ok) {
        const invoicesResult = await invoicesResponse.json()
        if (invoicesResult.invoices && invoicesResult.invoices.length > 0) {
          // Filter for template invoices that start with "inv"
          const templateInvoices = invoicesResult.invoices.filter((invoice: Invoice) => {
            // Check if it's a template invoice
            const isTemplate =
              invoice.isTemplateInvoice === true ||
              (typeof invoice.items === "string" && invoice.items.toLowerCase().includes("template")) ||
              (Array.isArray(invoice.items) &&
                invoice.items.some(
                  (item) => item.type === "template" || (item.tier && item.tier.toLowerCase().includes("template")),
                ))

            // Check if invoice number starts with "inv"
            const startsWithInv = invoice.invoiceNumber.toLowerCase().startsWith("inv")

            return isTemplate && startsWithInv
          })

          if (templateInvoices.length > 0) {
            // Sort by date (newest first) and get the first one
            invoiceData = templateInvoices.sort(
              (a: Invoice, b: Invoice) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
            )[0]
            console.log("Fetched invoice data:", invoiceData)
          }
        }
      }
    } catch (error) {
      console.error("Error fetching invoice data:", error)
    }

    // Step 3: Merge data from all sources, prioritizing the most specific/recent data
    // Create a merged business data object
    const mergedBusinessData = {
      // Start with the original business data
      ...businessData,

      // Override with dashboard data if available
      name: dashboardBusinessData?.name || businessData?.name || userData.name,
      formationDate: dashboardBusinessData?.formationDate || businessData?.formationDate,
      ein: dashboardBusinessData?.ein || businessData?.ein,
      businessId: dashboardBusinessData?.businessId || businessData?.businessId,

      // Override with invoice data if available
      email: invoiceData?.customerEmail || businessData?.email || userData.email,
      phone: invoiceData?.customerPhone || businessData?.phone || userData.phoneNumber,
      address: formatInvoiceAddress(invoiceData) || businessData?.address || userData.userAddress,

      // Keep other fields
      website: businessData?.website,
      industry: businessData?.industry,
      createdAt: businessData?.createdAt || new Date(),
      updatedAt: businessData?.updatedAt || new Date(),
    }

    // Return the merged business and user data
    return NextResponse.json({
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
        email: invoiceData?.customerEmail || userData.email,
        phone: invoiceData?.customerPhone || userData.phoneNumber || "",
        address: formatInvoiceAddress(invoiceData) || userData.userAddress || "",
      },
    })
  } catch (error) {
    console.error("Error fetching business profile:", error)
    return NextResponse.json({ error: "Failed to fetch business profile" }, { status: 500 })
  }
}

// Helper function to format address from invoice data
function formatInvoiceAddress(invoice: Invoice | null): string | null {
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
    // Get the current user session
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse the request body
    const body = await req.json()

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
      } else {
        // Create new phone request
        await db.$executeRawUnsafe(
          `INSERT INTO PhoneNumberRequest (id, userId, phoneNumber, status, createdAt, updatedAt) 
           VALUES (UUID(), ?, ?, 'approved', NOW(), NOW())`,
          session.user.id,
          body.phone,
        )
      }
    }

    // Update address if provided
    if (body.address !== undefined) {
      // Check if address column exists in User table
      const userColumns = await db.$queryRawUnsafe(`SHOW COLUMNS FROM User LIKE 'address'`)

      if (userColumns && userColumns.length > 0) {
        await db.$executeRawUnsafe(`UPDATE User SET address = ? WHERE id = ?`, body.address, session.user.id)
      } else {
        // If address doesn't exist in User table, update it in Business table if business exists
        if (userData.businessId) {
          await db.$executeRawUnsafe(`UPDATE Business SET address = ? WHERE id = ?`, body.address, userData.businessId)
        }
      }
    }

    // Handle business information
    let businessId = userData.businessId

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
        RETURNING id
      `

      const newBusiness = await db.$executeRawUnsafe(
        newBusinessQuery,
        body.name || userData.name || "My Business",
        body.website || "",
        updatedIndustry || JSON.stringify(customData),
        body.address || userData.userAddress || "",
      )

      businessId = newBusiness[0].id

      // Update user with business ID
      await db.$executeRawUnsafe(`UPDATE User SET businessId = ? WHERE id = ?`, businessId, session.user.id)
    } else {
      // Update the existing business
      const updateFields = []
      const params = []

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

    // Fetch additional data from other sources
    // Step 1: Fetch additional business data from /api/user/business
    let dashboardBusinessData = null
    try {
      const businessResponse = await fetch(`${req.nextUrl.origin}/api/user/business`, {
        headers: {
          cookie: req.headers.get("cookie") || "",
        },
      })

      if (businessResponse.ok) {
        const businessResult = await businessResponse.json()
        if (businessResult.business) {
          dashboardBusinessData = businessResult.business
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard business data:", error)
    }

    // Step 2: Fetch invoice data to get additional user information
    let invoiceData = null
    try {
      // First try admin endpoint
      let invoicesResponse = await fetch(`${req.nextUrl.origin}/api/admin/invoices`, {
        headers: {
          cookie: req.headers.get("cookie") || "",
        },
      })

      // If admin endpoint fails (e.g., not an admin), try user-specific endpoint
      if (!invoicesResponse.ok) {
        invoicesResponse = await fetch(`${req.nextUrl.origin}/api/user/invoices`, {
          headers: {
            cookie: req.headers.get("cookie") || "",
          },
        })
      }

      if (invoicesResponse.ok) {
        const invoicesResult = await invoicesResponse.json()
        if (invoicesResult.invoices && invoicesResult.invoices.length > 0) {
          // Filter for template invoices that start with "inv"
          const templateInvoices = invoicesResult.invoices.filter((invoice: Invoice) => {
            // Check if it's a template invoice
            const isTemplate =
              invoice.isTemplateInvoice === true ||
              (typeof invoice.items === "string" && invoice.items.toLowerCase().includes("template")) ||
              (Array.isArray(invoice.items) &&
                invoice.items.some(
                  (item) => item.type === "template" || (item.tier && item.tier.toLowerCase().includes("template")),
                ))

            // Check if invoice number starts with "inv"
            const startsWithInv = invoice.invoiceNumber.toLowerCase().startsWith("inv")

            return isTemplate && startsWithInv
          })

          if (templateInvoices.length > 0) {
            // Sort by date (newest first) and get the first one
            invoiceData = templateInvoices.sort(
              (a: Invoice, b: Invoice) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
            )[0]
          }
        }
      }
    } catch (error) {
      console.error("Error fetching invoice data:", error)
    }

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
      name: dashboardBusinessData?.name || updatedBusinessData?.name || updatedUserData.name,
      formationDate: dashboardBusinessData?.formationDate || updatedBusinessData?.formationDate,
      ein: dashboardBusinessData?.ein || updatedBusinessData?.ein,
      businessId: dashboardBusinessData?.businessId || updatedBusinessData?.businessId,

      // Override with invoice data if available (but only if not explicitly updated in this request)
      email:
        body.email !== undefined
          ? body.email
          : invoiceData?.customerEmail || updatedBusinessData?.email || updatedUserData.email,
      phone:
        body.phone !== undefined
          ? body.phone
          : invoiceData?.customerPhone || updatedBusinessData?.phone || updatedUserData.phoneNumber,
      address:
        body.address !== undefined
          ? body.address
          : formatInvoiceAddress(invoiceData) || updatedBusinessData?.address || updatedUserData.userAddress,
    }

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
        email: invoiceData?.customerEmail || updatedUserData.email,
        phone: body.phone || invoiceData?.customerPhone || updatedUserData.phoneNumber || "",
        address: body.address || formatInvoiceAddress(invoiceData) || updatedUserData.userAddress || "",
      },
    })
  } catch (error) {
    console.error("Error updating business profile:", error)
    return NextResponse.json({ error: "Failed to update business profile" }, { status: 500 })
  }
}

