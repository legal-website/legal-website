import { PrismaClient } from "@prisma/client"
import { hashPassword } from "../lib/auth"

const prisma = new PrismaClient()

async function main() {
  try {
    console.log("Starting admin user seeding...")

    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: "ary5054@gmail.com" },
    })

    if (existingAdmin) {
      console.log("Admin user already exists, updating role and password...")

      // Update existing user to ensure they have admin role
      await prisma.user.update({
        where: { email: "ary5054@gmail.com" },
        data: {
          role: "ADMIN",
          password: await hashPassword("p@$$worD1122"),
          emailVerified: new Date(),
        },
      })

      console.log("Admin user updated successfully")
    } else {
      console.log("Creating new admin user...")

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

      console.log("Admin user created successfully")
    }
  } catch (error) {
    console.error("Error seeding admin user:", error)
  } finally {
    await prisma.$disconnect()
  }
}

main()

