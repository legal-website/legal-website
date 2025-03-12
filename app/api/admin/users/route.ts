import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Role } from "@prisma/client"
import { hash } from "bcryptjs"
import { getAppUrl } from "@/lib/get-app-url"
import { sendEmail } from "@/lib/email"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated and is an admin
    if (!session || session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all users with fields that exist in the schema
    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        image: true,
        business: {
          select: {
            name: true,
            phone: true,
            address: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Format the users to include virtual fields for the UI
    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: user.name || "Unknown",
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      image: user.image,
      // Add virtual fields from business or with default values
      company: user.business?.name || "Not specified",
      phone: user.business?.phone || "Not provided",
      address: user.business?.address || "Not provided",
      status: "Active", // Virtual field
      lastActive: "Never", // Virtual field
    }))

    return NextResponse.json({ users: formattedUsers })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated and is an admin
    if (!session || session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    const { name, email, password, role, sendInvite } = data
    // Extract business data if provided
    const businessData = data.business || {}

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 })
    }

    // Hash the password
    const hashedPassword = await hash(password, 10)

    // Create the user with fields that exist in the schema
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || Role.CLIENT,
        emailVerified: sendInvite ? null : new Date(), // If sending invite, email is not verified yet
        // Create or connect to a business if business data is provided
        ...(businessData.name && {
          business: {
            create: {
              name: businessData.name,
              phone: businessData.phone || null,
              address: businessData.address || null,
              email: businessData.email || email,
            },
          },
        }),
      },
    })

    // Send welcome email if requested
    if (sendInvite) {
      try {
        const appUrl = getAppUrl()

        // Generate a verification token
        const token = await db.verificationToken.create({
          data: {
            identifier: email,
            token: `${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            userId: user.id, // Connect to the user using the userId field
          },
        })

        const verificationUrl = `${appUrl}/verify-email?token=${token.token}`

        await sendEmail({
          to: email,
          subject: "Welcome to Our Platform - Verify Your Email",
          text: `Welcome to our platform! Please verify your email by clicking this link: ${verificationUrl}`,
          html: `
            <div>
              <h1>Welcome to Our Platform!</h1>
              <p>Your account has been created by an administrator.</p>
              <p>Please verify your email by clicking the button below:</p>
              <a href="${verificationUrl}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                Verify Email
              </a>
              <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
              <p>${verificationUrl}</p>
              <p>This link will expire in 24 hours.</p>
            </div>
          `,
        })
      } catch (emailError) {
        console.error("Error sending welcome email:", emailError)
        // We don't want to fail the user creation if the email fails
        // But we should log it
      }
    }

    return NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}

