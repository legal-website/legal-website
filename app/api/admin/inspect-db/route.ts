import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  console.log("GET /api/admin/inspect-db - Start")

  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions)

    if (!session) {
      console.log("GET /api/admin/inspect-db - Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT") {
      console.log("GET /api/admin/inspect-db - Forbidden")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Inspect the database client
    console.log("Inspecting database client...")

    // Get all properties of the db object
    const properties = Object.keys(db)

    // Check for common Prisma methods
    const hasPrismaProperty = "prisma" in db
    const hasQueryRaw = "$queryRaw" in db
    const hasExecute = "$execute" in db
    const hasTransaction = "$transaction" in db

    // Check for models
    const models = properties.filter(
      (prop) =>
        typeof db[prop as keyof typeof db] === "object" && !prop.startsWith("$") && !["_", "prisma"].includes(prop),
    )

    // For each model, check available methods
    const modelDetails: Record<string, string[]> = {}
    for (const model of models) {
      const modelObj = db[model as keyof typeof db]
      if (modelObj && typeof modelObj === "object") {
        modelDetails[model] = Object.keys(modelObj)
      }
    }

    return NextResponse.json({
      success: true,
      dbType: typeof db,
      properties,
      isPrismaClient: hasPrismaProperty || hasQueryRaw || hasExecute || hasTransaction,
      models,
      modelDetails,
    })
  } catch (error) {
    console.error("Error inspecting database:", error)
    return NextResponse.json(
      {
        error: "Failed to inspect database: " + (error instanceof Error ? error.message : "Unknown error"),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

