"use server"

import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// Define the types for search results
export type SearchResult = {
  id: string
  title: string
  description: string
  url: string
  type: "document" | "ticket" | "community" | "report" | "profile"
  icon: string
}

export async function searchContent(query: string): Promise<SearchResult[]> {
  if (!query || query.trim() === "") {
    return []
  }

  // Get the current user session
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return []
  }

  // Only proceed if user is a client
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })

  if (user?.role !== "CLIENT") {
    return []
  }

  // Normalize the search query
  const normalizedQuery = query.toLowerCase().trim()

  // Initialize result arrays
  let documents: any[] = []
  let tickets: any[] = []
  let communityPosts: any[] = []
  let reports: any[] = []

  try {
    // Try to search for documents
    try {
      documents = await db.document.findMany({
        where: {
          OR: [
            { title: { contains: normalizedQuery, mode: "insensitive" } },
            { description: { contains: normalizedQuery, mode: "insensitive" } },
          ],
          userId: session.user.id,
        },
        select: {
          id: true,
          title: true,
          description: true,
          createdAt: true,
        },
        take: 3,
      })
    } catch (error) {
      console.log("Document model not found or error:", error)
    }

    // Try to search for tickets
    try {
      // Use type assertion to avoid TypeScript error
      const dbAny = db as any
      if (dbAny.ticket) {
        tickets = await dbAny.ticket.findMany({
          where: {
            OR: [
              { title: { contains: normalizedQuery, mode: "insensitive" } },
              { description: { contains: normalizedQuery, mode: "insensitive" } },
            ],
            userId: session.user.id,
          },
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
          },
          take: 3,
        })
      }
    } catch (error) {
      console.log("Ticket model not found or error:", error)
    }

    // Try to search for community posts
    try {
      communityPosts = await db.post.findMany({
        where: {
          OR: [
            { title: { contains: normalizedQuery, mode: "insensitive" } },
            { content: { contains: normalizedQuery, mode: "insensitive" } },
          ],
          authorId: session.user.id,
        },
        select: {
          id: true,
          title: true,
          content: true,
        },
        take: 3,
      })
    } catch (error) {
      console.log("Post model not found or error:", error)
    }

    // Try to search for annual reports
    try {
      // Use type assertion to avoid TypeScript error
      const dbAny = db as any
      if (dbAny.annualReport) {
        reports = await dbAny.annualReport.findMany({
          where: {
            OR: [
              { title: { contains: normalizedQuery, mode: "insensitive" } },
              { description: { contains: normalizedQuery, mode: "insensitive" } },
            ],
            userId: session.user.id,
          },
          select: {
            id: true,
            title: true,
            description: true,
            year: true,
          },
          take: 3,
        })
      }
    } catch (error) {
      console.log("Annual report model not found or error:", error)
    }

    // Format the results with null checks
    const formattedDocuments = documents.map((doc) => ({
      id: doc.id || "unknown",
      title: doc.title || "Untitled Document",
      description:
        doc.description ||
        `Document created on ${doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : "unknown date"}`,
      url: `/dashboard/documents/business/${doc.id || "unknown"}`,
      type: "document" as const,
      icon: "File",
    }))

    const formattedTickets = tickets.map((ticket) => ({
      id: ticket.id || "unknown",
      title: ticket.title || "Untitled Ticket",
      description: ticket.description || `Ticket status: ${ticket.status || "unknown"}`,
      url: `/dashboard/tickets/${ticket.id || "unknown"}`,
      type: "ticket" as const,
      icon: "TicketIcon",
    }))

    const formattedPosts = communityPosts.map((post) => ({
      id: post.id || "unknown",
      title: post.title || "Untitled Post",
      description: post.content
        ? post.content.substring(0, 100) + (post.content.length > 100 ? "..." : "")
        : "No content",
      url: `/dashboard/community/post/${post.id || "unknown"}`,
      type: "community" as const,
      icon: "Users",
    }))

    const formattedReports = reports.map((report) => ({
      id: report.id || "unknown",
      title: report.title || "Untitled Report",
      description: report.description || `Annual report for ${report.year || "unknown year"}`,
      url: `/dashboard/compliance/annual-reports/${report.id || "unknown"}`,
      type: "report" as const,
      icon: "FileText",
    }))

    // Combine all results
    const allResults = [...formattedDocuments, ...formattedTickets, ...formattedPosts, ...formattedReports]

    return allResults
  } catch (error) {
    console.error("Search error:", error)
    return []
  }
}

