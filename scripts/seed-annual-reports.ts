import { PrismaClient } from "@prisma/client"
import { UserRole } from "@/lib/db/schema"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding annual reports data...")

  try {
    // Get admin user
    const adminUser = await prisma.user.findFirst({
      where: {
        role: UserRole.ADMIN,
      },
    })

    if (!adminUser) {
      console.error("No admin user found")
      return
    }

    // Get a client user
    const clientUser = await prisma.user.findFirst({
      where: {
        role: UserRole.CLIENT,
      },
    })

    if (!clientUser) {
      console.error("No client user found")
      return
    }

    console.log("Found admin user:", adminUser.email)
    console.log("Found client user:", clientUser.email)

    // Create filing requirements
    const requirements = await prisma.filingRequirement.createMany({
      data: [
        {
          title: "Annual Report Filing",
          description: "Basic requirements for annual report filing",
          details: "Payment receipt\nCompany information\nFinancial summary",
          isActive: true,
        },
        {
          title: "Financial Disclosure",
          description: "Financial disclosure requirements",
          details: "Balance sheet\nIncome statement\nCash flow statement",
          isActive: true,
        },
      ],
      skipDuplicates: true,
    })

    console.log("Created filing requirements:", requirements)

    // Create a deadline for the client
    const deadline = await prisma.annualReportDeadline.create({
      data: {
        userId: clientUser.id,
        title: "2024 Annual Report",
        description: "Annual report filing for the year 2024",
        dueDate: new Date("2024-12-31"),
        fee: 75.0,
        lateFee: 25.0,
        status: "pending",
      },
    })

    console.log("Created deadline:", deadline)

    console.log("Seeding completed successfully")
  } catch (error) {
    console.error("Seeding failed:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .then(() => console.log("Seeding script completed"))
  .catch((e) => {
    console.error("Seeding script failed:", e)
    process.exit(1)
  })

