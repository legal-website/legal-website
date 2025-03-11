import { NextResponse, type NextRequest } from "next/server"
import { PrismaClient } from "@prisma/client"
import { hashPassword } from "@/lib/auth"

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  // This should only be accessible in development or with a special setup key
  const setupKey = req.nextUrl.searchParams.get("key")
  const isDevEnvironment = process.env.NODE_ENV === "development"

  // Only allow in development or with the correct setup key
  if (!isDevEnvironment && setupKey !== process.env.ADMIN_SETUP_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: "ary5054@gmail.com" },
    })

    if (existingAdmin) {
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
      })
    } else {
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

