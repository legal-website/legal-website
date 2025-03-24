import type React from "react"
export interface ChartConfig {
  [key: string]: {
    label: string
    color: string
  }
}

export type ChartColors = Record<string, string>

export interface ChartTooltipProps {
  active?: boolean
  payload?: Array<{
    value: number
    name: string
    dataKey: string
    payload: Record<string, any>
  }>
  label?: string
}

export interface ChartContainerProps {
  config: ChartConfig
  className?: string
  children: React.ReactNode
}

