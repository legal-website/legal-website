"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDateForChart } from "@/lib/chart-utils"

// Import Chart.js
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from "chart.js"

// Register Chart.js components
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

interface LineChartProps {
  title: string
  description?: string
  data: any[]
  xField: string
  yField: string
  dateField?: string
  color?: string
  formatYValue?: (value: number) => string
  height?: number
}

export function LineChart({
  title,
  description,
  data,
  xField,
  yField,
  dateField,
  color = "#22c55e",
  formatYValue = (value) => `${value}`,
  height = 300,
}: LineChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  useEffect(() => {
    if (!chartRef.current || !data || data.length === 0) return

    // Destroy previous chart instance if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const ctx = chartRef.current.getContext("2d")
    if (!ctx) return

    // Prepare data
    const labels = data.map((item) => (dateField ? formatDateForChart(new Date(item[dateField])) : item[xField]))
    const values = data.map((item) => item[yField])

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, `${color}33`) // 20% opacity
    gradient.addColorStop(1, `${color}00`) // 0% opacity

    const chartData: ChartData = {
      labels,
      datasets: [
        {
          label: title,
          data: values,
          borderColor: color,
          backgroundColor: gradient,
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: color,
          pointBorderColor: "#fff",
          pointBorderWidth: 1,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    }

    const options: ChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (context) => formatYValue(context.parsed.y),
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            borderDash: [2, 2],
          },
          ticks: {
            callback: (value) => {
              if (typeof value === "number") {
                return formatYValue(value)
              }
              return value
            },
          },
        },
      },
    }

    // Create new chart
    chartInstance.current = new Chart(ctx, {
      type: "line",
      data: chartData,
      options,
    })

    // Cleanup function
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [data, xField, yField, dateField, title, color, formatYValue, height])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div style={{ height: `${height}px` }}>
          <canvas ref={chartRef} />
        </div>
      </CardContent>
    </Card>
  )
}

