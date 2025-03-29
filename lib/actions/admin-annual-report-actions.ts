"use server"

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function getUpcomingAnnualReports(limit = 3) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  // Only admin can view all annual reports
  if (session.user.role !== "ADMIN") {
    return { error: "Unauthorized" }
  }

  try {
    // Get current date for comparison
    const currentDate = new Date()

    // Fetch all annual reports with related business and user data
    // @ts-ignore - Prisma client type issue
    const allReports = await db.annualReport.findMany({
      include: {
        business: true,
        user: true,
      },
      orderBy: {
        dueDate: "asc", // Order by due date ascending to get the nearest ones first
      },
      take: limit * 2, // Fetch more than we need to ensure we have enough after filtering
    })

    console.log(`Found ${allReports.length} annual reports in database`)

    // Filter for reports with due dates in the future or recent past
    const upcomingReports = allReports
      .filter((report: any) => {
        // Include reports due within the next 60 days or overdue within the last 30 days
        if (!report.dueDate) return false

        const dueDate = new Date(report.dueDate)
        const daysDifference = Math.floor((dueDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))

        return daysDifference > -30 && daysDifference < 60
      })
      .slice(0, limit)

    console.log(`Filtered to ${upcomingReports.length} upcoming reports`)

    // Process reports to ensure consistent format
    const processedReports = upcomingReports.map((report: any) => {
      const businessName = report.business?.name || report.businessName || "Unknown Business"
      const businessId = report.businessId || report.business?.id || "unknown-business"

      return {
        id: report.id,
        title: report.title || `Annual Report ${report.year || new Date().getFullYear()}`,
        status: report.status || "pending",
        createdAt: report.createdAt.toISOString(),
        dueDate: report.dueDate ? new Date(report.dueDate).toISOString() : null,
        businessName,
        businessId,
        year: report.year || new Date().getFullYear().toString(),
      }
    })

    console.log(`Returning ${processedReports.length} processed reports`)
    return { reports: processedReports }
  } catch (error) {
    console.error("Error fetching upcoming annual reports:", error)
    return { error: "Failed to fetch annual reports" }
  }
}

