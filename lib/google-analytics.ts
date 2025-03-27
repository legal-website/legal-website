import * as googleapis from "googleapis"
const { google } = googleapis
import type { analyticsreporting_v4 } from "googleapis"

// Use the proper types from the googleapis library
type Report = analyticsreporting_v4.Schema$Report
type Row = analyticsreporting_v4.Schema$ReportRow

// Initialize the Analytics Reporting API v4
export const analyticsReporting = google.analyticsreporting({
  version: "v4",
  auth: new google.auth.JWT(
    process.env.GOOGLE_CLIENT_EMAIL,
    undefined,
    process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    ["https://www.googleapis.com/auth/analytics.readonly"],
  ),
})

// Get date range for queries (last 30 days by default)
export function getDateRange(startDate?: string, endDate?: string) {
  if (startDate && endDate) {
    return {
      startDate,
      endDate,
    }
  }

  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 30)

  return {
    startDate: formatDate(start),
    endDate: formatDate(end),
  }
}

// Format date to YYYY-MM-DD
export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0]
}

// Get page views for a specific date range
export async function getPageViews(viewId: string, startDate?: string, endDate?: string) {
  const { startDate: start, endDate: end } = getDateRange(startDate, endDate)

  try {
    const response = await analyticsReporting.reports.batchGet({
      requestBody: {
        reportRequests: [
          {
            viewId,
            dateRanges: [{ startDate: start, endDate: end }],
            metrics: [{ expression: "ga:pageviews" }],
            dimensions: [{ name: "ga:date" }],
          },
        ],
      },
    })

    return processReportData(response.data.reports?.[0])
  } catch (error) {
    console.error("Error fetching page views:", error)
    throw error
  }
}

// Get top pages
export async function getTopPages(viewId: string, startDate?: string, endDate?: string, limit = 10) {
  const { startDate: start, endDate: end } = getDateRange(startDate, endDate)

  try {
    const response = await analyticsReporting.reports.batchGet({
      requestBody: {
        reportRequests: [
          {
            viewId,
            dateRanges: [{ startDate: start, endDate: end }],
            metrics: [{ expression: "ga:pageviews" }, { expression: "ga:avgTimeOnPage" }],
            dimensions: [{ name: "ga:pagePath" }],
            orderBys: [
              {
                fieldName: "ga:pageviews",
                sortOrder: "DESCENDING",
              },
            ],
            pageSize: limit,
          },
        ],
      },
    })

    return processTopPagesData(response.data.reports?.[0])
  } catch (error) {
    console.error("Error fetching top pages:", error)
    throw error
  }
}

// Get user demographics
export async function getUserDemographics(viewId: string, startDate?: string, endDate?: string) {
  const { startDate: start, endDate: end } = getDateRange(startDate, endDate)

  try {
    const response = await analyticsReporting.reports.batchGet({
      requestBody: {
        reportRequests: [
          {
            viewId,
            dateRanges: [{ startDate: start, endDate: end }],
            metrics: [{ expression: "ga:users" }],
            dimensions: [{ name: "ga:country" }],
            orderBys: [
              {
                fieldName: "ga:users",
                sortOrder: "DESCENDING",
              },
            ],
            pageSize: 10,
          },
        ],
      },
    })

    return processCountryData(response.data.reports?.[0])
  } catch (error) {
    console.error("Error fetching user demographics:", error)
    throw error
  }
}

// Get traffic sources
export async function getTrafficSources(viewId: string, startDate?: string, endDate?: string) {
  const { startDate: start, endDate: end } = getDateRange(startDate, endDate)

  try {
    const response = await analyticsReporting.reports.batchGet({
      requestBody: {
        reportRequests: [
          {
            viewId,
            dateRanges: [{ startDate: start, endDate: end }],
            metrics: [{ expression: "ga:sessions" }],
            dimensions: [{ name: "ga:source" }],
            orderBys: [
              {
                fieldName: "ga:sessions",
                sortOrder: "DESCENDING",
              },
            ],
            pageSize: 10,
          },
        ],
      },
    })

    return processSourceData(response.data.reports?.[0])
  } catch (error) {
    console.error("Error fetching traffic sources:", error)
    throw error
  }
}

// Get device categories
export async function getDeviceCategories(viewId: string, startDate?: string, endDate?: string) {
  const { startDate: start, endDate: end } = getDateRange(startDate, endDate)

  try {
    const response = await analyticsReporting.reports.batchGet({
      requestBody: {
        reportRequests: [
          {
            viewId,
            dateRanges: [{ startDate: start, endDate: end }],
            metrics: [{ expression: "ga:sessions" }],
            dimensions: [{ name: "ga:deviceCategory" }],
          },
        ],
      },
    })

    return processDeviceData(response.data.reports?.[0])
  } catch (error) {
    console.error("Error fetching device categories:", error)
    throw error
  }
}

// Get summary metrics
export async function getSummaryMetrics(viewId: string, startDate?: string, endDate?: string) {
  const { startDate: start, endDate: end } = getDateRange(startDate, endDate)

  try {
    const response = await analyticsReporting.reports.batchGet({
      requestBody: {
        reportRequests: [
          {
            viewId,
            dateRanges: [{ startDate: start, endDate: end }],
            metrics: [
              { expression: "ga:users" },
              { expression: "ga:newUsers" },
              { expression: "ga:sessions" },
              { expression: "ga:pageviews" },
              { expression: "ga:avgSessionDuration" },
              { expression: "ga:bounceRate" },
            ],
          },
        ],
      },
    })

    return processSummaryData(response.data.reports?.[0])
  } catch (error) {
    console.error("Error fetching summary metrics:", error)
    throw error
  }
}

// Process report data for time series
function processReportData(report: Report | undefined) {
  if (!report || !report.data || !report.data.rows) {
    return []
  }

  return report.data.rows.map((row: Row) => {
    const date = row.dimensions?.[0] || ""
    const formattedDate = `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(6, 8)}`
    return {
      date: formattedDate,
      value: Number.parseInt(row.metrics?.[0]?.values?.[0] || "0", 10),
    }
  })
}

// Process top pages data
function processTopPagesData(report: Report | undefined) {
  if (!report || !report.data || !report.data.rows) {
    return []
  }

  return report.data.rows.map((row: Row) => {
    return {
      page: row.dimensions?.[0] || "",
      pageviews: Number.parseInt(row.metrics?.[0]?.values?.[0] || "0", 10),
      avgTimeOnPage: Number.parseFloat(row.metrics?.[0]?.values?.[1] || "0"),
    }
  })
}

// Process country data
function processCountryData(report: Report | undefined) {
  if (!report || !report.data || !report.data.rows) {
    return []
  }

  return report.data.rows.map((row: Row) => {
    return {
      country: row.dimensions?.[0] || "",
      users: Number.parseInt(row.metrics?.[0]?.values?.[0] || "0", 10),
    }
  })
}

// Process source data
function processSourceData(report: Report | undefined) {
  if (!report || !report.data || !report.data.rows) {
    return []
  }

  return report.data.rows.map((row: Row) => {
    return {
      source: row.dimensions?.[0] || "",
      sessions: Number.parseInt(row.metrics?.[0]?.values?.[0] || "0", 10),
    }
  })
}

// Process device data
function processDeviceData(report: Report | undefined) {
  if (!report || !report.data || !report.data.rows) {
    return []
  }

  return report.data.rows.map((row: Row) => {
    return {
      device: row.dimensions?.[0] || "",
      sessions: Number.parseInt(row.metrics?.[0]?.values?.[0] || "0", 10),
    }
  })
}

// Process summary data
function processSummaryData(report: Report | undefined) {
  if (!report || !report.data || !report.data.rows) {
    return null
  }

  const values = report.data.rows[0]?.metrics?.[0]?.values || []

  return {
    users: Number.parseInt(values[0] || "0", 10),
    newUsers: Number.parseInt(values[1] || "0", 10),
    sessions: Number.parseInt(values[2] || "0", 10),
    pageviews: Number.parseInt(values[3] || "0", 10),
    avgSessionDuration: Number.parseFloat(values[4] || "0"),
    bounceRate: Number.parseFloat(values[5] || "0"),
  }
}

