import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

const prisma = new PrismaClient()

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated and is an admin
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = params.id

    // Fetch user sessions for activity
    const sessions = await prisma.session.findMany({
      where: { userId: userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    })

    // Fetch user tickets for activity
    const tickets = await prisma.ticket.findMany({
      where: {
        OR: [{ creatorId: userId }, { assigneeId: userId }],
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    })

    // Format activities
    const activities = [
      ...sessions.map((session) => ({
        action: "Login Session",
        date: new Date(session.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        details: `Session created at ${new Date(session.createdAt).toLocaleTimeString()}`,
      })),
      ...tickets.map((ticket) => ({
        action: ticket.creatorId === userId ? "Created Ticket" : "Assigned Ticket",
        date: new Date(ticket.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        details: `${ticket.subject} (${ticket.status})`,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json({ activities })
  } catch (error) {
    console.error("Error fetching user activity:", error)
    return NextResponse.json({ error: "Failed to fetch user activity" }, { status: 500 })
  }
}

