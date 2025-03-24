"use client"

import * as React from "react"
import type { ChartConfig, ChartColors } from "@/types/chart"

const ChartContext = React.createContext<{
  config: ChartConfig
  colors: ChartColors
} | null>(null)

export function ChartContainer({
  config,
  className,
  children,
}: {
  config: ChartConfig
  className?: string
  children: React.ReactNode
}) {
  // Generate CSS variables for chart colors
  const colors = React.useMemo(() => {
    return Object.entries(config).reduce(
      (acc, [key, value]) => {
        acc[`--color-${key}`] = value.color
        return acc
      },
      {} as Record<string, string>,
    )
  }, [config])

  return (
    <ChartContext.Provider value={{ config, colors }}>
      <div className={className} style={colors as React.CSSProperties}>
        {children}
      </div>
    </ChartContext.Provider>
  )
}

export function useChartContext() {
  const context = React.useContext(ChartContext)
  if (!context) {
    throw new Error("useChartContext must be used within a ChartContainer")
  }
  return context
}

interface ChartTooltipProps {
  active?: boolean
  payload?: Array<{
    value: number
    name: string
    dataKey: string
    payload: Record<string, any>
  }>
  label?: string
  content?: React.ReactNode
  children?: React.ReactNode
}

export function ChartTooltip({ active, payload, label, content, children, ...props }: ChartTooltipProps) {
  const { config } = useChartContext()

  if (content) {
    return content as React.ReactElement
  }

  if (children) {
    return children as React.ReactElement
  }

  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm" {...props}>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-muted-foreground">{label}</span>
            <span className="font-bold text-muted-foreground">{payload[0].payload.month}</span>
          </div>
          {payload.map((entry) => {
            const dataKey = entry.dataKey as keyof typeof config
            const color = config[dataKey]?.color

            return (
              <div key={entry.dataKey} className="flex flex-col">
                <span className="text-[0.70rem] uppercase text-muted-foreground" style={{ color }}>
                  {config[dataKey]?.label}
                </span>
                <span className="font-bold" style={{ color }}>
                  {entry.value}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return null
}

export function ChartTooltipContent({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{
    value: number
    name: string
    dataKey: string
    payload: Record<string, any>
  }>
}) {
  const { config } = useChartContext()

  if (active && payload && payload.length) {
    const dataKey = payload[0].dataKey as keyof typeof config
    const color = config[dataKey]?.color

    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-muted-foreground">Month</span>
            <span className="font-bold text-muted-foreground">{payload[0].payload.month}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-muted-foreground" style={{ color }}>
              {config[dataKey]?.label}
            </span>
            <span className="font-bold" style={{ color }}>
              {payload[0].value}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return null
}

