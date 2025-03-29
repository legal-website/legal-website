"use server"

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function getUpcomingAnnualReports(limit = 3) {
  try {
    console.log("Starting getUpcomingAnnualReports server action")

    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      console.log("Unauthorized: No session or user ID")
      return { error: "Unauthorized" }
    }

    // Only admin can view all annual reports
    if (session.user.role !== "ADMIN") {
      console.log("Unauthorized: User is not an admin", session.user.role)
      return { error: "Unauthorized" }
    }

    console.log("Authorization passed, fetching annual reports")

    // Get current date for comparison
    const currentDate = new Date()

    try {
      // Check if the AnnualReportDeadline table exists (using the correct table name)
      const tableExists = await checkIfTableExists("AnnualReportDeadline")
      if (!tableExists) {
        console.log("AnnualReportDeadline table does not exist")
        // Return empty array instead of error to avoid breaking the UI
        return { reports: [] }
      }

      console.log("Attempting to fetch annual reports from database")

      // Fetch all annual reports from the correct table
      // Using raw query with the correct table name
      const allReports = await db.$queryRaw`
        SELECT 
          id, 
          title, 
          status, 
          dueDate,
          userId,
          description
        FROM "AnnualReportDeadline"
        ORDER BY "dueDate" ASC
        LIMIT ${limit * 2}
      `

      console.log(`Found ${allReports.length} annual reports in database`)
      console.log("Sample report:", allReports.length > 0 ? JSON.stringify(allReports[0]) : "No reports found")

      // Filter for reports with due dates in the future or recent past
      const upcomingReports = Array.isArray(allReports)
        ? allReports
            .filter((report: any) => {
              // Include reports due within the next 60 days or overdue within the last 30 days
              if (!report.dueDate) return false

              const dueDate = new Date(report.dueDate)
              const daysDifference = Math.floor((dueDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))

              return daysDifference > -30 && daysDifference < 60
            })
            .slice(0, limit)
        : []

      console.log(`Filtered to ${upcomingReports.length} upcoming reports`)

      // Process reports to ensure consistent format
      const processedReports = upcomingReports.map((report: any) => {
        // Get user information if available
        const userId = report.userId || "unknown-user"

        // Format the title
        const title = report.title || `Annual Report ${new Date(report.dueDate).getFullYear()}`

        return {
          id: report.id,
          title: title,
          status: report.status || "pending",
          createdAt: new Date().toISOString(), // Use current date if not available
          dueDate: report.dueDate
            ? report.dueDate instanceof Date
              ? report.dueDate.toISOString()
              : report.dueDate
            : null,
          businessName: report.description || "Business", // Use description as business name if available
          businessId: userId,
          year: report.dueDate
            ? new Date(report.dueDate).getFullYear().toString()
            : new Date().getFullYear().toString(),
        }
      })

      console.log(`Returning ${processedReports.length} processed reports`)
      return { reports: processedReports }
    } catch (dbError) {
      console.error("Database error fetching annual reports:", dbError)
      // Return empty array instead of error to avoid breaking the UI
      return { reports: [] }
    }
  } catch (error) {
    console.error("Unexpected error in getUpcomingAnnualReports:", error)
    // Return empty array instead of error to avoid breaking the UI
    return { reports: [] }
  }
}

// Helper function to check if a table exists
async function checkIfTableExists(tableName: string): Promise<boolean> {
  try {
    // This query works for PostgreSQL
    const result = await db.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = ${tableName}
      );
    `

    // The result will be an array with one object containing the EXISTS result
    const exists = Array.isArray(result) && result.length > 0 ? result[0].exists : false
    console.log(`Table ${tableName} exists: ${exists}`)
    return exists
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error)
    return false
  }
}

