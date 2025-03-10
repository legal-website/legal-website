import prisma from "@/lib/prisma"
import { randomBytes, scryptSync, timingSafeEqual } from "crypto"
import nodemailer from "nodemailer"

// Define the Role type directly
export type Role = "ADMIN" | "SUPPORT" | "CLIENT"

// Generate a random salt
const generateSalt = () => {
  return randomBytes(16).toString("hex")
}

// Hash a password
export async function hashPassword(password: string): Promise<string> {
  const salt = generateSalt()
  const hash = scryptSync(password, salt, 64).toString("hex")
  return `${salt}:${hash}`
}

// Verify a password
export async function verifyPassword(storedPassword: string, suppliedPassword: string): Promise<boolean> {
  try {
    const [salt, hash] = storedPassword.split(":")
    const hashBuffer = Buffer.from(hash, "hex")
    const suppliedHashBuffer = scryptSync(suppliedPassword, salt, 64)
    return timingSafeEqual(hashBuffer, suppliedHashBuffer)
  } catch (e) {
    return false
  }
}

// Register a new user
export async function registerUser(
  email: string,
  password: string,
  name: string,
  role: Role = "CLIENT",
  businessId?: string,
) {
  const hashedPassword = await hashPassword(password)

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role,
      businessId,
    },
  })

  // Generate verification token
  await sendVerificationEmail(user.id, email)

  return user
}

// Send verification email
export async function sendVerificationEmail(userId: string, email: string) {
  // Generate a token
  const token = randomBytes(32).toString("hex")
  const expires = new Date()
  expires.setHours(expires.getHours() + 24) // Token expires in 24 hours

  // Save the token
  await prisma.verificationToken.create({
    data: {
      token,
      identifier: email,
      expires,
      userId,
    },
  })

  // Create email transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT),
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
    secure: true,
  })

  // Send the email
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Verify your email address",
    html: `
      <div>
        <h1>Email Verification</h1>
        <p>Thank you for registering. Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}">Verify Email</a>
        <p>This link will expire in 24 hours.</p>
      </div>
    `,
  })

  return token
}

// Verify email with token
export async function verifyEmail(token: string) {
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!verificationToken) {
    throw new Error("Invalid token")
  }

  if (verificationToken.expires < new Date()) {
    throw new Error("Token expired")
  }

  // Mark email as verified
  await prisma.user.update({
    where: { id: verificationToken.userId },
    data: { emailVerified: new Date() },
  })

  // Delete the token
  await prisma.verificationToken.delete({
    where: { id: verificationToken.id },
  })

  return verificationToken.user
}

// Login a user
export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) return null

  const isValid = await verifyPassword(user.password, password)
  if (!isValid) return null

  // Create a session token
  const token = randomBytes(32).toString("hex")
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // Token expires in 7 days

  await prisma.session.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  })

  return { user, token }
}

// Validate a session token
export async function validateSession(token: string) {
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!session || session.expiresAt < new Date()) {
    // Session expired or not found
    if (session) {
      // Clean up expired session
      await prisma.session.delete({ where: { id: session.id } })
    }
    return null
  }

  return session.user
}

// Logout a user
export async function logoutUser(token: string): Promise<boolean> {
  try {
    await prisma.session.delete({
      where: { token },
    })
    return true
  } catch (error) {
    return false
  }
}

// Create or get user from OAuth
export async function getOrCreateUserFromOAuth(
  provider: string,
  providerAccountId: string,
  email: string,
  name?: string,
  image?: string,
) {
  // Check if user exists with this provider
  const existingAccount = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider,
        providerAccountId,
      },
    },
    include: { user: true },
  })

  if (existingAccount) {
    return existingAccount.user
  }

  // Check if user exists with this email
  let user = await prisma.user.findUnique({
    where: { email },
  })

  // If no user exists, create one
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: name || email.split("@")[0],
        password: randomBytes(32).toString("hex"), // Random password for OAuth users
        image,
        emailVerified: new Date(), // OAuth emails are pre-verified
      },
    })
  }

  // Create account link
  await prisma.account.create({
    data: {
      userId: user.id,
      type: "oauth",
      provider,
      providerAccountId,
    },
  })

  return user
}

