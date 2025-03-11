import { PrismaClient } from "@prisma/client"
import { v4 as uuidv4 } from "uuid"
import nodemailer from "nodemailer"
import { scrypt, randomBytes } from "crypto"
import { promisify } from "util"

const scryptAsync = promisify(scrypt)
const prisma = new PrismaClient()

// Password strength validation
export function isStrongPassword(password: string): { isStrong: boolean; message: string } {
  const minLength = 8
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)

  if (password.length < minLength) {
    return { isStrong: false, message: `Password must be at least ${minLength} characters long` }
  }

  if (!hasUpperCase) {
    return { isStrong: false, message: "Password must contain at least one uppercase letter" }
  }

  if (!hasLowerCase) {
    return { isStrong: false, message: "Password must contain at least one lowercase letter" }
  }

  if (!hasNumbers) {
    return { isStrong: false, message: "Password must contain at least one number" }
  }

  if (!hasSpecialChar) {
    return { isStrong: false, message: "Password must contain at least one special character" }
  }

  return { isStrong: true, message: "Password is strong" }
}

// Setup email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT),
  secure: Number(process.env.EMAIL_SERVER_PORT) === 465,
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
})

// Hash password using scrypt (Node.js built-in)
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex")
  const buf = (await scryptAsync(password, salt, 64)) as Buffer
  return `${buf.toString("hex")}.${salt}`
}

// Verify password
export async function verifyPassword(hashedPassword: string, plainPassword: string): Promise<boolean> {
  try {
    const [hashed, salt] = hashedPassword.split(".")
    const buf = (await scryptAsync(plainPassword, salt, 64)) as Buffer
    return buf.toString("hex") === hashed
  } catch (error) {
    console.error("Password verification error:", error)
    return false
  }
}

// Register user
export async function registerUser(
  email: string,
  password: string,
  name: string,
  role = "CLIENT",
  businessId?: string,
) {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    throw new Error("User already exists")
  }

  // Validate password strength
  const passwordCheck = isStrongPassword(password)
  if (!passwordCheck.isStrong) {
    throw new Error(passwordCheck.message)
  }

  const hashedPassword = await hashPassword(password)
  const verificationToken = uuidv4()

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role,
      businessId,
      emailVerified: null,
      verificationTokens: {
        create: {
          token: verificationToken,
          identifier: email,
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      },
    },
    include: {
      verificationTokens: true,
    },
  })

  // Send verification email
  await sendVerificationEmail(email, name, verificationToken)

  // Remove sensitive data before returning
  const { password: _, ...userWithoutPassword } = user
  return userWithoutPassword
}

// Login user
export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    return null
  }

  if (!user.emailVerified) {
    throw new Error("Email not verified. Please check your email for verification link.")
  }

  const isValid = await verifyPassword(user.password, password)

  if (!isValid) {
    return null
  }

  // Create a session
  const token = uuidv4()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  })

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user

  return { user: userWithoutPassword, token: session.token }
}

// Verify email
export async function verifyEmail(token: string) {
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!verificationToken || verificationToken.expires < new Date()) {
    throw new Error("Invalid or expired verification token")
  }

  const updatedUser = await prisma.user.update({
    where: { id: verificationToken.userId },
    data: {
      emailVerified: new Date(),
    },
  })

  // Delete the used token
  await prisma.verificationToken.delete({
    where: { id: verificationToken.id },
  })

  // Remove password from response
  const { password: _, ...userWithoutPassword } = updatedUser
  return userWithoutPassword
}

// Request password reset
export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    // For security reasons, don't reveal if the user exists
    return true
  }

  const resetToken = uuidv4()
  const expires = new Date(Date.now() + 3600000) // 1 hour from now

  // Create a verification token for password reset
  await prisma.verificationToken.create({
    data: {
      token: resetToken,
      identifier: `reset-${email}`,
      expires,
      userId: user.id,
    },
  })

  // Send password reset email
  await sendPasswordResetEmail(email, user.name || "User", resetToken)

  return true
}

// Reset password
export async function resetPassword(token: string, newPassword: string) {
  // Validate password strength
  const passwordCheck = isStrongPassword(newPassword)
  if (!passwordCheck.isStrong) {
    throw new Error(passwordCheck.message)
  }

  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
    include: { user: true },
  })

  if (
    !verificationToken ||
    verificationToken.expires < new Date() ||
    !verificationToken.identifier.startsWith("reset-")
  ) {
    throw new Error("Invalid or expired reset token")
  }

  const hashedPassword = await hashPassword(newPassword)

  const updatedUser = await prisma.user.update({
    where: { id: verificationToken.userId },
    data: {
      password: hashedPassword,
    },
  })

  // Delete the used token
  await prisma.verificationToken.delete({
    where: { id: verificationToken.id },
  })

  // Remove password from response
  const { password: _, ...userWithoutPassword } = updatedUser
  return userWithoutPassword
}

// Get or create user from OAuth
export async function getOrCreateUserFromOAuth(
  provider: string,
  providerAccountId: string,
  email: string,
  name?: string,
  image?: string,
) {
  let user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    // Create a new user with a random password
    const randomPassword = randomBytes(16).toString("hex")
    const hashedPassword = await hashPassword(randomPassword)

    user = await prisma.user.create({
      data: {
        email,
        name: name || email.split("@")[0],
        password: hashedPassword,
        emailVerified: new Date(), // Email is verified via OAuth
        image,
        role: "CLIENT",
      },
    })
  }

  // Create or update the OAuth account
  await prisma.account.upsert({
    where: {
      provider_providerAccountId: {
        provider,
        providerAccountId,
      },
    },
    create: {
      userId: user.id,
      provider,
      providerAccountId,
      type: "oauth",
    },
    update: {
      userId: user.id,
    },
  })

  return user
}

// Send verification email
async function sendVerificationEmail(email: string, name: string, token: string) {
  const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Verify Your Email",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Our Platform</h2>
        <p>Hello ${name},</p>
        <p>Thank you for registering. Please verify your email by clicking the button below:</p>
        <a href="${verificationLink}" style="display: inline-block; background-color: #22c984; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 20px 0;">Verify Email</a>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p>${verificationLink}</p>
        <p>This link will expire in 24 hours.</p>
        <p>Regards,<br>The Support Team</p>
      </div>
    `,
  }

  return transporter.sendMail(mailOptions)
}

// Send payment approval email
export async function sendPaymentApprovalEmail(email: string, name: string, invoiceId: string) {
  const registerLink = `${process.env.NEXT_PUBLIC_APP_URL}/register?invoice=${invoiceId}`

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Payment Approved - Complete Your Registration",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Payment Approved!</h2>
        <p>Hello ${name},</p>
        <p>Your payment has been approved. Thank you for your purchase!</p>
        <p>Please complete your registration to access your account:</p>
        <a href="${registerLink}" style="display: inline-block; background-color: #22c984; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 20px 0;">Complete Registration</a>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p>${registerLink}</p>
        <p>Regards,<br>The Support Team</p>
      </div>
    `,
  }

  return transporter.sendMail(mailOptions)
}

// Send password reset email
async function sendPasswordResetEmail(email: string, name: string, token: string) {
  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Reset Your Password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Hello ${name},</p>
        <p>We received a request to reset your password. Click the button below to reset it:</p>
        <a href="${resetLink}" style="display: inline-block; background-color: #22c984; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 20px 0;">Reset Password</a>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p>${resetLink}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Regards,<br>The Support Team</p>
      </div>
    `,
  }

  return transporter.sendMail(mailOptions)
}

