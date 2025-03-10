"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, CheckCircle, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export type Plan = {
  id: string | number
  name: string
  price: number
  frequency: string
  features: string[]
  recommended: boolean
  assistBadge: boolean
  includesPackage?: string
}

export const columns: ColumnDef<Plan>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const name = row.getValue("name") as string
      const recommended = row.original.recommended
      const assistBadge = row.original.assistBadge

      return (
        <div className="flex items-center gap-2">
          <span className="font-medium">{name}</span>
          {recommended && (
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
              <CheckCircle className="h-3 w-3 mr-1" />
              Recommended
            </Badge>
          )}
          {assistBadge && (
            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
              <Shield className="h-3 w-3 mr-1" />
              Assist
            </Badge>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "price",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Price
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const price = Number.parseFloat(row.getValue("price"))
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(price)

      return <div>{formatted}</div>
    },
  },
  {
    accessorKey: "frequency",
    header: "Billing Cycle",
  },
  {
    accessorKey: "includesPackage",
    header: "Includes Package",
    cell: ({ row }) => {
      const includesPackage = row.getValue("includesPackage") as string | undefined
      return includesPackage ? includesPackage : "-"
    },
  },
  {
    accessorKey: "features",
    header: "Features",
    cell: ({ row }) => {
      const features = row.getValue("features") as string[]
      return (
        <div className="flex flex-wrap gap-1">
          {features.slice(0, 2).map((feature, index) => (
            <Badge key={index} variant="outline">
              {feature}
            </Badge>
          ))}
          {features.length > 2 && <Badge variant="outline">+{features.length - 2} more</Badge>}
        </div>
      )
    },
  },
]

