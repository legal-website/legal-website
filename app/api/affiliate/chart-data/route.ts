import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { AffiliateConversionStatus } from "@/lib/affiliate-types"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = new URL(req.url).searchParams
    const chartType = searchParams.get("type") || "earnings"
    const period = searchParams.get("period") || "6months"

    // Get affiliate link
    const affiliateLink = await db.affiliateLink.findUnique({
      where: { userId: session.user.id },
    })

    if (!affiliateLink) {
      return NextResponse.json({ data: [] })
    }

    const startDate = new Date()

    // Set the date range based on the period
    if (period === "30days") {
      startDate.setDate(startDate.getDate() - 30)
    } else if (period === "90days") {
      startDate.setDate(startDate.getDate() - 90)
    } else if (period === "6months") {
      startDate.setMonth(startDate.getMonth() - 6)
    } else if (period === "1year") {
      startDate.setFullYear(startDate.getFullYear() - 1)
    }

    if (chartType === "earnings") {
      // Get earnings data grouped by month
      const conversions = await db.affiliateConversion.findMany({
        where: {
          linkId: affiliateLink.id,
          createdAt: {
            gte: startDate,
          },
          status: {
            in: [AffiliateConversionStatus.APPROVED, AffiliateConversionStatus.PAID],
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      })

      // Group by month and calculate total
      const monthlyData = conversions.reduce((acc: Record<string, number>, conversion) => {
        const date = new Date(conversion.createdAt)
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

        if (!acc[monthYear]) {
          acc[monthYear] = 0
        }

        acc[monthYear] += Number(conversion.commission)
        return acc
      }, {})

      // Convert to array format for chart
      const chartData = Object.entries(monthlyData).map(([month, amount]) => {
        const [year, monthNum] = month.split("-")
        return {
          month: new Date(Number.parseInt(year), Number.parseInt(monthNum) - 1, 1).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          }),
          amount: amount,
        }
      })

      return NextResponse.json({ data: chartData })
    } else if (chartType === "clicks") {
      // Get clicks data grouped by day
      const clicks = await db.affiliateClick.findMany({
        where: {
          linkId: affiliateLink.id,
          createdAt: {
            gte: startDate,
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      })

      // Group by day and count
      const dailyData = clicks.reduce((acc: Record<string, number>, click) => {
        const date = new Date(click.createdAt)
        const dayKey = date.toISOString().split("T")[0]

        if (!acc[dayKey]) {
          acc[dayKey] = 0
        }

        acc[dayKey] += 1
        return acc
      }, {})

      // Fill in missing days with zero values
      const currentDate = new Date(startDate)
      const endDate = new Date()
      const filledData: Record<string, number> = {}

      while (currentDate <= endDate) {
        const dayKey = currentDate.toISOString().split("T")[0]
        filledData[dayKey] = dailyData[dayKey] || 0
        currentDate.setDate(currentDate.getDate() + 1)
      }

      // Convert to array format for chart
      const chartData = Object.entries(filledData).map(([day, count]) => {
        return {
          date: day,
          clicks: count,
        }
      })

      return NextResponse.json({ data: chartData })
    }

    return NextResponse.json({ error: "Invalid chart type" }, { status: 400 })
  } catch (error) {
    console.error("Error fetching chart data:", error)
    return NextResponse.json({ error: "Failed to fetch chart data" }, { status: 500 })
  }
}

