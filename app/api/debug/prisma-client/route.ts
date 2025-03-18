import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { UserRole } from "@/lib/db/schema"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the available models on the prisma object
    const models = Object.keys(prisma).filter(
      (key) => !key.startsWith("_") && typeof prisma[key as keyof typeof prisma] === "object",
    )

    // Test if we can access the User model
    let userModelTest = "Not available"
    try {
      const userCount = await prisma.user.count()
      userModelTest = `Available (${userCount} users found)`
    } catch (error) {
      userModelTest = `Error: ${(error as Error).message}`
    }

    return NextResponse.json({
      models,
      userModelTest,
      prismaType: typeof prisma,
      message: "Prisma client structure retrieved",
    })
  } catch (error) {
    console.error("Error in prisma-client route:", error)
    return NextResponse.json({ error: "Failed to get prisma client structure" }, { status: 500 })
  }
}

