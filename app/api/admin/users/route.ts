import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Role } from "@prisma/client"
import { hash } from "bcryptjs"
import { getAppUrl } from "@/lib/get-app-url"
import { sendEmail } from "@/lib/email"

// In-memory store for online users
const onlineUsers = new Map<string, Date>()

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated and is an admin
    if (!session || session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(req.url)
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const limit = Number.parseInt(url.searchParams.get("limit") || "10")

    // Get all users with their sessions for last active time
    const users = await db.user.findMany({
      skip: (page - 1) * limit,
      take: limit,
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
        sessions: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Get online users
    const onlineUserIds = Array.from(onlineUsers.keys())

    // Format users for the UI with correct last active time and online status
    const formattedUsers = users.map((user) => {
      // Check if user is online
      const isOnline = onlineUserIds.includes(user.id)

      // For last active, use the most recent session's creation time
      // If no session, fall back to the user's last update or creation time
      const lastActive =
        user.sessions && user.sessions.length > 0 ? user.sessions[0].createdAt : user.updatedAt || user.createdAt

      // Determine status based on emailVerified
      let status = "Pending"
      if (user.emailVerified) {
        status = "Active"
      } else {
        // Check if there's a verification token for this user
        // This is a virtual status, not stored in the database
        if (isOnline) {
          status = "Active" // If they're online, they're active
        } else if (user.sessions && user.sessions.length > 0) {
          status = "Active" // If they have sessions, they're active
        } else {
          // Check if there's a verification token
          // This is a simplified approach - in a real app, you'd check the database
          status = "Validation Email Sent"
        }
      }

      return {
        id: user.id,
        name: user.name || "Unknown",
        email: user.email,
        role: user.role,
        status: status,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        lastActive: lastActive,
        isOnline: isOnline,
        image: user.image,
        company: user.business?.name || "Not specified",
        phone: user.business?.phone || "Not provided",
        address: user.business?.address || "Not provided",
      }
    })

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
    const { name, email, password, role, sendInvite, phone, company, notes, skipHashing } = data

    // Extract business data if provided
    const businessData = {
      name: company || null,
      phone: phone || null,
      address: data.address || null,
      email: email,
    }

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

    // Hash the password only if skipHashing is not true
    const hashedPassword = skipHashing ? password : await hash(password, 10)

    // Create the user with fields that exist in the schema
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || Role.CLIENT,
        emailVerified: sendInvite ? null : new Date(), // If sending invite, email is not verified yet
        // status field is not in the schema, so we don't include it
        // Create business record if company name is provided
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

    // Determine initial status (virtual field, not stored in DB)
    let status = sendInvite ? "Validation Email Sent" : "Active"

    // Send welcome email if requested
    if (sendInvite) {
      try {
        console.log("Sending welcome email to:", email)
        // Get the app URL with a fallback to the Vercel deployment URL
        const appUrl = getAppUrl() || "https://legal-website-five.vercel.app"
        console.log("App URL:", appUrl)

        // Generate a verification token
        const token = await db.verificationToken.create({
          data: {
            identifier: email,
            token: `${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            userId: user.id, // Connect to the user using the userId field
          },
        })

        // Create verification URL that redirects to login after verification
        const verificationUrl = `${appUrl}/verify-email?token=${token.token}&redirect=/login`
        console.log("Verification URL:", verificationUrl)

        // Send the email with detailed logging
        const emailResult = await sendEmail({
          to: email,
          subject: "Welcome to Our Platform - Verify Your Email",
          text: `Welcome to our platform! Please verify your email by clicking this link: ${verificationUrl}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #22c984;">Welcome to Our Platform!</h1>
              <p>Hello ${name},</p>
              <p>Your account has been created by an administrator.</p>
              <p>Please verify your email and set up your account by clicking the button below:</p>
              <a href="${verificationUrl}" style="display: inline-block; background-color: #22c984; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                Verify Email & Set Up Account
              </a>
              <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
              <p style="word-break: break-all;">${verificationUrl}</p>
              <p>This link will expire in 24 hours.</p>
              <p>If you have any questions, please contact our support team.</p>
              <p>Welcome aboard!</p>
            </div>
          `,
        })

        console.log("Email sending result:", emailResult)

        if (!emailResult.success) {
          console.error("Failed to send email:", emailResult.error)
          status = "Pending"
          return NextResponse.json(
            {
              user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: status,
              },
              warning: "User created but failed to send welcome email",
            },
            { status: 201 },
          )
        }

        console.log("Welcome email sent successfully")
      } catch (emailError) {
        console.error("Error sending welcome email:", emailError)
        // We don't want to fail the user creation if the email fails
        // But we should log it and return a warning
        status = "Pending"
        return NextResponse.json(
          {
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              status: status,
            },
            warning: "User created but failed to send welcome email",
          },
          { status: 201 },
        )
      }
    }

    return NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: status, // This is a virtual field, not stored in DB
        },
        message: sendInvite ? "User created and welcome email sent" : "User created successfully",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}

