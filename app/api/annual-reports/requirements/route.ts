import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get active requirements
    const requirements = await db.filingRequirement.findMany({
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
    return NextResponse.json({ requirements: [] }, { status: 200 })
  }
}

