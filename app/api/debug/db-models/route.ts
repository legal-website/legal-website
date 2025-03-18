import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { UserRole } from "@/lib/db/schema"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the available models on the db object
    const models = Object.keys(db).filter(
      (key) => !key.startsWith("_") && typeof db[key as keyof typeof db] === "object",
    )

    return NextResponse.json({ models })
  } catch (error) {
    console.error("Error in db-models route:", error)
    return NextResponse.json({ error: "Failed to get db models" }, { status: 500 })
  }
}

