import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { UserRole } from "@/lib/db/schema"

export async function GET(req: Request) {
  try {
    console.log("GET /api/admin/annual-reports/requirements - Starting request")

    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if the table exists by querying information schema
    try {
      const tableExists = await db.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'FilingRequirement'
        )
      `

      const exists = Array.isArray(tableExists) && tableExists.length > 0 ? tableExists[0].exists : false

      if (!exists) {
        console.log("FilingRequirement table does not exist")
        return NextResponse.json({
          requirements: [],
          warning: "Annual reports feature is not fully set up",
        })
      }

      // Get all requirements
      const requirements = await db.filingRequirement.findMany({
        orderBy: {
          title: "asc",
        },
      })

      console.log(`Found ${requirements.length} requirements`)
      return NextResponse.json({ requirements })
    } catch (dbError: any) {
      console.error("Database error:", dbError)

      // Return empty array with warning instead of error
      return NextResponse.json({
        requirements: [],
        warning: "Could not retrieve requirements",
      })
    }
  } catch (error) {
    console.error("Error fetching requirements:", error)
    return NextResponse.json(
      {
        requirements: [],
        error: "Failed to fetch requirements",
      },
      { status: 500 },
    )
  }
}

