import { NextResponse, type NextRequest } from "next/server"
import { PrismaClient } from "@prisma/client"
import { hashPassword } from "@/lib/auth"

const prisma = new PrismaClient()

// Define a default setup key that will work if no environment variable is set
const DEFAULT_SETUP_KEY = "setup-orizen-admin-direct"

export async function GET(req: NextRequest) {
  // Get the setup key from query parameters
  const setupKey = req.nextUrl.searchParams.get("key")
  const isDevEnvironment = process.env.NODE_ENV === "development"
  const validSetupKey = process.env.ADMIN_SETUP_KEY || DEFAULT_SETUP_KEY

  // Allow access in development or with the correct setup key
  if (!isDevEnvironment && setupKey !== validSetupKey) {
    console.log("Unauthorized setup attempt. Invalid or missing setup key.")
    return NextResponse.json(
      {
        error: "Unauthorized. Please provide a valid setup key as a query parameter: ?key=YOUR_SETUP_KEY",
      },
      { status: 401 },
    )
  }

  try {
    console.log("Starting direct admin user setup...")

    // Use a direct database query to check if admin user exists
    const adminEmail = "ary5054@gmail.com"
    const hashedPassword = await hashPassword("p@$$worD1122")

    // Try to find the admin user
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    })

    if (existingAdmin) {
      console.log("Admin user exists, updating with direct query...")

      // Update the admin user with a direct query
      await prisma.$executeRaw`
        UPDATE User 
        SET role = 'ADMIN', 
            password = ${hashedPassword}, 
            emailVerified = ${new Date()} 
        WHERE email = ${adminEmail}
      `

      return NextResponse.json({
        success: true,
        message: "Admin user updated successfully with direct query",
        action: "updated",
        loginEmail: adminEmail,
        loginPassword: "p@$$worD1122",
      })
    } else {
      console.log("Admin user doesn't exist, creating with direct query...")

      // Create the admin user with a direct query
      await prisma.$executeRaw`
        INSERT INTO User (
          id, 
          email, 
          name, 
          password, 
          role, 
          emailVerified, 
          createdAt, 
          updatedAt
        ) 
        VALUES (
          UUID(), 
          ${adminEmail}, 
          'Super Admin', 
          ${hashedPassword}, 
          'ADMIN', 
          ${new Date()}, 
          ${new Date()}, 
          ${new Date()}
        )
      `

      return NextResponse.json({
        success: true,
        message: "Admin user created successfully with direct query",
        action: "created",
        loginEmail: adminEmail,
        loginPassword: "p@$$worD1122",
      })
    }
  } catch (error: any) {
    console.error("Error in direct admin setup:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An error occurred while setting up the admin user",
      },
      { status: 500 },
    )
  }
}

