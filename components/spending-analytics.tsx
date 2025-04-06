"use client"

// Note: You need to install recharts with: npm install recharts
// or: yarn add recharts

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { DollarSign, Package, FileText, Clock } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

// Import these after installing recharts
// If you're using TypeScript, you might also need to install @types/recharts
// npm install --save-dev @types/recharts
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface SpendingData {
  totalSpent: number
  packageCount: number
  templateCount: number
  packageSpending: number
  templateSpending: number
  recentInvoices: RecentInvoice[]
  monthlyData: MonthlyData[]
}

interface RecentInvoice {
  id: string
  invoiceNumber: string
  amount: number
  createdAt: string
  isTemplateInvoice: boolean
}

interface MonthlyData {
  month: string
  year: number
  total: number
  packages: number
  templates: number
}

export default function SpendingAnalytics() {
  const [spendingData, setSpendingData] = useState<SpendingData | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    async function fetchSpendingData() {
      try {
        setLoading(true)
        const response = await fetch("/api/user/spending")

        if (!response.ok) {
          throw new Error("Failed to fetch spending data")
        }

        const data = await response.json()
        if (data.success && data.spending) {
          setSpendingData(data.spending)
        }
      } catch (error) {
        console.error("Error fetching spending data:", error)
        toast({
          title: "Error",
          description: "Failed to load spending analytics. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSpendingData()
  }, [toast])

  if (loading) {
    return (
      <Card className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
        <CardContent className="p-6">
          <div className="flex justify-center items-center h-[250px]">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!spendingData) {
    return (
      <Card className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
        <CardContent className="p-6">
          <h3 className="text-2xl font-bold mb-4">Spending Analytics</h3>
          <p className="mb-6 text-base font-medium">
            No spending data available yet. Your purchase history will appear here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
      <CardContent className="p-6">
        <h3 className="text-2xl font-bold mb-4">Spending Analytics</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 mr-3 text-white/80" />
              <div>
                <p className="text-sm text-white/80">Total Spent</p>
                <p className="text-2xl font-bold">${spendingData.totalSpent.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center">
              <Package className="h-8 w-8 mr-3 text-white/80" />
              <div>
                <p className="text-sm text-white/80">Packages</p>
                <p className="text-2xl font-bold">
                  {spendingData.packageCount}{" "}
                  <span className="text-sm font-normal">(${spendingData.packageSpending.toFixed(2)})</span>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center">
              <FileText className="h-8 w-8 mr-3 text-white/80" />
              <div>
                <p className="text-sm text-white/80">Templates</p>
                <p className="text-2xl font-bold">
                  {spendingData.templateCount}{" "}
                  <span className="text-sm font-normal">(${spendingData.templateSpending.toFixed(2)})</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Spending Chart */}
        <div className="bg-white/10 rounded-lg p-4 mb-4 h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={spendingData.monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="month"
                tick={{ fill: "white" }}
                tickLine={{ stroke: "white" }}
                axisLine={{ stroke: "white" }}
              />
              <YAxis
                tick={{ fill: "white" }}
                tickLine={{ stroke: "white" }}
                axisLine={{ stroke: "white" }}
                tickFormatter={(value: number) => `$${value}`}
              />
              <Tooltip
                formatter={(value: number, name: string) => {
                  const label = name === "packages" ? "Packages" : "Templates"
                  return [`$${Number(value).toFixed(2)}`, label]
                }}
                contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "none", borderRadius: "4px" }}
                labelStyle={{ color: "white" }}
              />
              <Legend wrapperStyle={{ color: "white" }} />
              <Bar dataKey="packages" name="Packages" fill="#22c984" />
              <Bar dataKey="templates" name="Templates" fill="#f472b6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Purchases */}
        {spendingData.recentInvoices.length > 0 && (
          <div className="bg-white/10 rounded-lg p-4">
            <h4 className="text-lg font-semibold mb-3">Recent Purchases</h4>
            <div className="space-y-2">
              {spendingData.recentInvoices.map((invoice) => (
                <div key={invoice.id} className="flex justify-between items-center">
                  <div className="flex items-center">
                    {invoice.invoiceNumber.startsWith("TEMP") ? (
                      <FileText className="h-4 w-4 mr-2 text-white/80" />
                    ) : (
                      <Package className="h-4 w-4 mr-2 text-white/80" />
                    )}
                    <span className="text-sm">
                      {invoice.invoiceNumber.startsWith("TEMP") ? "Template" : "Package"} - {invoice.invoiceNumber}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium mr-3">${invoice.amount.toFixed(2)}</span>
                    <Clock className="h-3 w-3 text-white/60" />
                    <span className="text-xs text-white/60 ml-1">
                      {new Date(invoice.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

