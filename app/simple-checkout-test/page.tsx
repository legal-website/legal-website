"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import SimpleCheckout from "@/components/simple-checkout"
import ErrorTracker from "@/components/error-tracker"

export default function SimpleCheckoutTest() {
  const [customer] = useState({
    name: "Test Customer",
    email: "test@example.com",
  })

  const [items] = useState([
    {
      id: "test-item",
      tier: "BASIC",
      price: 99.99,
    },
  ])

  const [total] = useState(99.99)

  return (
    <div className="container mx-auto py-10">
      <ErrorTracker />
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Simple Checkout Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-gray-100 rounded-md">
            <h3 className="font-medium mb-2">Customer:</h3>
            <p>Name: {customer.name}</p>
            <p>Email: {customer.email}</p>

            <h3 className="font-medium mt-4 mb-2">Items:</h3>
            {items.map((item, index) => (
              <div key={index} className="mb-2">
                <p>Tier: {item.tier}</p>
                <p>Price: ${item.price.toFixed(2)}</p>
              </div>
            ))}

            <h3 className="font-medium mt-4 mb-2">Total:</h3>
            <p>${total.toFixed(2)}</p>
          </div>

          <SimpleCheckout customer={customer} items={items} total={total} className="w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

