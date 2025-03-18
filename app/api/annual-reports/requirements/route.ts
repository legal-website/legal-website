import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get active requirements
    const requirements = await prisma.filingRequirement.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        title: "asc",
      },
    })

    return NextResponse.json({ requirements })
  } catch (error) {
    console.error("Error fetching requirements:", error)
    return NextResponse.json({ error: "Failed to fetch requirements" }, { status: 500 })
  }
}

