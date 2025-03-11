import { NextResponse, type NextRequest } from "next/server"
import { PrismaClient } from "@prisma/client"
import { hashPassword } from "@/lib/auth"

const prisma = new PrismaClient()

// Define a default setup key that will work if no environment variable is set
const DEFAULT_SETUP_KEY = "setup-orizen-admin-account"

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
    console.log("Starting admin user setup...")

    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: "ary5054@gmail.com" },
    })

    if (existingAdmin) {
      console.log("Admin user exists, updating role and password...")

      // Update existing user to ensure they have admin role
      await prisma.user.update({
        where: { email: "ary5054@gmail.com" },
        data: {
          role: "ADMIN",
          password: await hashPassword("p@$$worD1122"),
          emailVerified: new Date(),
        },
      })

      return NextResponse.json({
        success: true,
        message: "Admin user updated successfully",
        action: "updated",
        loginEmail: "ary5054@gmail.com",
        loginPassword: "p@$$worD1122", // Only showing this in the setup response
      })
    } else {
      console.log("Admin user doesn't exist, creating new admin user...")

      // Create new admin user
      await prisma.user.create({
        data: {
          email: "ary5054@gmail.com",
          name: "Super Admin",
          password: await hashPassword("p@$$worD1122"),
          role: "ADMIN",
          emailVerified: new Date(), // Mark as verified
        },
      })

      return NextResponse.json({
        success: true,
        message: "Admin user created successfully",
        action: "created",
        loginEmail: "ary5054@gmail.com",
        loginPassword: "p@$$worD1122", // Only showing this in the setup response
      })
    }
  } catch (error: any) {
    console.error("Error setting up admin user:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An error occurred while setting up the admin user",
      },
      { status: 500 },
    )
  }
}

