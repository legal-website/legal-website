import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import type { Invoice } from "@prisma/client"

interface MonthlySpendingData {
  month: string
  year: number
  total: number
  packages: number
  templates: number
}

interface MonthlySpendingMap {
  [key: string]: MonthlySpendingData
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's email from session
    const userEmail = session.user.email

    // Fetch all invoices for this user
    const invoices = await prisma.invoice.findMany({
      where: {
        customerEmail: userEmail,
        status: "paid", // Only count paid invoices
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Initialize counters
    let totalSpent = 0
    let packageCount = 0
    let templateCount = 0
    let packageSpending = 0
    let templateSpending = 0

    // Process each invoice
    const processedInvoices = invoices.map((invoice) => {
      let items: any[] = []
      let isTemplateInvoice = false

      try {
        // Parse items if they're stored as a string
        if (typeof invoice.items === "string") {
          items = JSON.parse(invoice.items)

          // Check if this is a template invoice
          isTemplateInvoice =
            (items as any).isTemplateInvoice ||
            (Array.isArray(items) &&
              items.some(
                (item) =>
                  item.type === "template" ||
                  (item.tier && typeof item.tier === "string" && item.tier.toLowerCase().includes("template")),
              )) ||
            invoice.items.toLowerCase().includes("template") ||
            invoice.items.toLowerCase().includes("istemplateinvoice")
        }
      } catch (e) {
        console.error(`Error parsing items for invoice ${invoice.id}:`, e)
        items = []
      }

      // Update counters
      totalSpent += invoice.amount

      if (isTemplateInvoice) {
        templateCount++
        templateSpending += invoice.amount
      } else {
        packageCount++
        packageSpending += invoice.amount
      }

      return {
        ...invoice,
        items,
        isTemplateInvoice,
      }
    })

    // Calculate monthly spending data for chart
    const monthlyData = calculateMonthlySpending(invoices)

    return NextResponse.json({
      success: true,
      spending: {
        totalSpent,
        packageCount,
        templateCount,
        packageSpending,
        templateSpending,
        recentInvoices: processedInvoices.slice(0, 5), // Return 5 most recent invoices
        monthlyData,
      },
    })
  } catch (error) {
    console.error("Error fetching user spending:", error)
    return NextResponse.json({ error: "Failed to fetch spending data" }, { status: 500 })
  }
}

// Helper function to calculate monthly spending for the chart
function calculateMonthlySpending(invoices: Invoice[]): MonthlySpendingData[] {
  const monthlySpending: MonthlySpendingMap = {}
  const now = new Date()
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(now.getMonth() - 5) // Get 6 months of data (current month + 5 previous)

  // Initialize all months with zero values
  for (let i = 0; i < 6; i++) {
    const date = new Date(now)
    date.setMonth(now.getMonth() - i)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    monthlySpending[monthKey] = {
      month: date.toLocaleString("default", { month: "short" }),
      year: date.getFullYear(),
      total: 0,
      packages: 0,
      templates: 0,
    }
  }

  // Fill in actual spending data
  invoices.forEach((invoice: Invoice) => {
    const date = new Date(invoice.createdAt)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

    // Only include data from the last 6 months
    if (date >= sixMonthsAgo && monthlySpending[monthKey]) {
      let isTemplateInvoice = false

      try {
        if (typeof invoice.items === "string") {
          const items = JSON.parse(invoice.items)
          isTemplateInvoice =
            (items as any).isTemplateInvoice ||
            (Array.isArray(items) &&
              items.some(
                (item: any) =>
                  item.type === "template" ||
                  (item.tier && typeof item.tier === "string" && item.tier.toLowerCase().includes("template")),
              )) ||
            invoice.items.toLowerCase().includes("template") ||
            invoice.items.toLowerCase().includes("istemplateinvoice")
        }
      } catch (e) {
        // If parsing fails, assume it's not a template invoice
        isTemplateInvoice = false
      }

      monthlySpending[monthKey].total += invoice.amount

      if (isTemplateInvoice) {
        monthlySpending[monthKey].templates += invoice.amount
      } else {
        monthlySpending[monthKey].packages += invoice.amount
      }
    }
  })

  // Convert to array and sort by date
  return Object.values(monthlySpending).sort((a, b) => {
    const aDate = new Date(`${a.year}-${a.month}-01`)
    const bDate = new Date(`${b.year}-${b.month}-01`)
    return aDate.getTime() - bDate.getTime()
  })
}

