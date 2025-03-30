import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

interface Document {
  id: string
  title: string
  description?: string | null
  createdAt: Date
}

interface Ticket {
  id: string
  title: string
  description?: string | null
  status: string
}

interface Post {
  id: string
  title: string
  content: string
}

interface AnnualReport {
  id: string
  title: string
  description?: string | null
  year: number
}

export interface SearchResult {
  type: string
  id: string
  title: string
  description?: string | null
  url: string
  icon: string
}

export async function search({ query }: { query: string }): Promise<SearchResult[]> {
  try {
    const session = await auth()
    const userId = session?.user?.id

    if (!userId) {
      console.log("No user ID found, returning empty search results")
      return []
    }

    const documents = await (db as any).document.findMany({
      where: {
        OR: [
          {
            title: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            description: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
        userId: userId,
      },
      take: 5,
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
      },
    })

    const tickets = await (db as any).ticket.findMany({
      where: {
        OR: [
          {
            title: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            description: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
        userId: userId,
      },
      take: 5,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
      },
    })

    const posts = await (db as any).post.findMany({
      where: {
        content: {
          contains: query,
          mode: "insensitive",
        },
      },
      take: 5,
      select: {
        id: true,
        title: true,
      },
    })

    const annualReports = await (db as any).annualReport.findMany({
      where: {
        OR: [
          {
            title: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            description: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
      },
      take: 5,
      select: {
        id: true,
        title: true,
        description: true,
        year: true,
      },
    })

    const searchResults: SearchResult[] = [
      ...documents.map((doc: Document) => ({
        type: "document",
        id: doc.id,
        title: doc.title,
        description: doc.description || "",
        url: `/dashboard/documents/${doc.id}`,
        icon: "File",
      })),
      ...tickets.map((ticket: Ticket) => ({
        type: "ticket",
        id: ticket.id,
        title: ticket.title,
        description: ticket.description || "",
        url: `/dashboard/tickets/${ticket.id}`,
        icon: "TicketIcon",
      })),
      ...posts.map((post: Post) => ({
        type: "post",
        id: post.id,
        title: post.title,
        url: `/dashboard/community/${post.id}`,
        icon: "Users",
      })),
      ...annualReports.map((report: AnnualReport) => ({
        type: "annualReport",
        id: report.id,
        title: report.title,
        description: report.description || "",
        url: `/dashboard/compliance/annual-reports/${report.id}`,
        icon: "FileText",
      })),
    ]

    return searchResults
  } catch (error: any) {
    console.error("Error performing search:", error)
    return []
  }
}

