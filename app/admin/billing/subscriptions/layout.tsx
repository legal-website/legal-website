import type React from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SubscriptionsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Subscription Management</h1>
      <Tabs defaultValue="pricing" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="pricing" asChild>
            <a href="/admin/billing/subscriptions">Pricing Management</a>
          </TabsTrigger>
          <TabsTrigger value="preview" asChild>
            <a href="/admin/billing/subscriptions/preview">Preview</a>
          </TabsTrigger>
          <TabsTrigger value="subscriptions" asChild>
            <a href="/admin/billing/subscriptions/list">Customer Subscriptions</a>
          </TabsTrigger>
        </TabsList>
        {children}
      </Tabs>
    </div>
  )
}

