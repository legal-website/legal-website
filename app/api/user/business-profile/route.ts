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

export async function GET(req: NextRequest) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Use raw SQL to get user with business relation since TypeScript is having issues with the Prisma types
    const userQuery = `
      SELECT u.*, b.* 
      FROM User u
      LEFT JOIN Business b ON u.businessId = b.id
      WHERE u.id = ?
    `

    const results = await db.$queryRawUnsafe(userQuery, session.user.id)
    const userData = results[0] as (UserModel & Partial<BusinessData>) | null

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Extract business data from the results
    const businessData = userData.businessId
      ? {
          id: userData.businessId,
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          address: userData.address,
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

    // Return the business and user data
    return NextResponse.json({
      business: businessData
        ? {
            ...businessData,
            serviceStatus: customData.serviceStatus,
            llcStatusMessage: customData.llcStatusMessage,
            llcProgress: customData.llcProgress,
            annualReportFee: customData.annualReportFee,
            annualReportFrequency: customData.annualReportFrequency,
            displayIndustry: customData.displayIndustry,
          }
        : null,
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        phone: userData.phone || "",
        address: userData.address || "",
      },
    })
  } catch (error) {
    console.error("Error fetching business profile:", error)
    return NextResponse.json({ error: "Failed to fetch business profile" }, { status: 500 })
  }
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

    // Use raw SQL to get user with business relation
    const userQuery = `
      SELECT u.*, b.* 
      FROM User u
      LEFT JOIN Business b ON u.businessId = b.id
      WHERE u.id = ?
    `

    const results = await db.$queryRawUnsafe(userQuery, session.user.id)
    const userData = results[0] as (UserModel & Partial<BusinessData>) | null

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update phone number through PhoneNumberRequest
    if (body.phone !== undefined) {
      // Check if phone request exists
      const phoneRequest = await db.$queryRawUnsafe(
        `SELECT * FROM PhoneNumberRequest WHERE userId = ?`,
        session.user.id,
      )

      if (phoneRequest && phoneRequest.length > 0) {
        // Update existing phone request
        await db.$executeRawUnsafe(
          `UPDATE PhoneNumberRequest SET phoneNumber = ?, status = 'approved', updatedAt = NOW() WHERE userId = ?`,
          body.phone,
          session.user.id,
        )
      } else {
        // Create new phone request
        await db.$executeRawUnsafe(
          `INSERT INTO PhoneNumberRequest (id, userId, phoneNumber, status, createdAt, updatedAt) VALUES (UUID(), ?, ?, 'approved', NOW(), NOW())`,
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
      const newBusiness = await db.$executeRawUnsafe(
        `INSERT INTO Business (id, name, website, industry, createdAt, updatedAt) 
         VALUES (UUID(), ?, ?, ?, NOW(), NOW())
         RETURNING id`,
        body.name || userData.name || "My Business",
        body.website || "",
        updatedIndustry || JSON.stringify(customData),
      )

      businessId = newBusiness[0].id

      // Update user with business ID
      await db.$executeRawUnsafe(`UPDATE User SET businessId = ? WHERE id = ?`, businessId, session.user.id)
    } else {
      // Update the existing business
      if (body.website !== undefined || updatedIndustry !== undefined) {
        let updateQuery = `UPDATE Business SET updatedAt = NOW()`
        const params = []

        if (body.website !== undefined) {
          updateQuery += `, website = ?`
          params.push(body.website)
        }

        if (updatedIndustry !== undefined) {
          updateQuery += `, industry = ?`
          params.push(updatedIndustry)
        }

        updateQuery += ` WHERE id = ?`
        params.push(businessId)

        await db.$executeRawUnsafe(updateQuery, ...params)
      }
    }

    // Get the updated user and business data
    const updatedResults = await db.$queryRawUnsafe(userQuery, session.user.id)
    const updatedUserData = updatedResults[0] as (UserModel & Partial<BusinessData>) | null

    if (!updatedUserData) {
      throw new Error("Failed to retrieve updated user")
    }

    // Get phone from PhoneNumberRequest
    const phoneRequestResult = await db.$queryRawUnsafe(
      `SELECT phoneNumber FROM PhoneNumberRequest WHERE userId = ? AND status = 'approved'`,
      session.user.id,
    )

    const phoneNumber = phoneRequestResult && phoneRequestResult.length > 0 ? phoneRequestResult[0].phoneNumber : ""

    // Extract updated business data
    const updatedBusinessData = updatedUserData.businessId
      ? {
          id: updatedUserData.businessId,
          name: updatedUserData.name,
          email: updatedUserData.email,
          phone: updatedUserData.phone,
          address: updatedUserData.address,
          website: updatedUserData.website,
          industry: updatedUserData.industry,
          formationDate: updatedUserData.formationDate,
          ein: updatedUserData.ein,
          businessId: updatedUserData.businessId,
          createdAt: updatedUserData.createdAt,
          updatedAt: updatedUserData.updatedAt,
        }
      : null

    return NextResponse.json({
      success: true,
      business: updatedBusinessData
        ? {
            ...updatedBusinessData,
            serviceStatus: customData.serviceStatus,
            llcStatusMessage: customData.llcStatusMessage,
            llcProgress: customData.llcProgress,
            annualReportFee: customData.annualReportFee,
            annualReportFrequency: customData.annualReportFrequency,
            displayIndustry: customData.displayIndustry || body.industry,
          }
        : null,
      user: {
        id: updatedUserData.id,
        name: updatedUserData.name,
        email: updatedUserData.email,
        phone: phoneNumber || "",
        address: updatedUserData.address || "",
      },
    })
  } catch (error) {
    console.error("Error updating business profile:", error)
    return NextResponse.json({ error: "Failed to update business profile" }, { status: 500 })
  }
}

