"use client"

import { Check } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface PricingTableProps {
  pricing: {
    starter: number
    pro: number
    business: number
  }
}

export function PricingTable({ pricing }: PricingTableProps) {
  const plans = [
    {
      name: "Starter",
      price: pricing.starter,
      description: "Essential features for small businesses",
      features: ["Company Formation", "Registered Agent", "Ein (Tax ID)", "Operating Agreement", "Standard Address"],
    },
    {
      name: "Pro",
      price: pricing.pro,
      description: "Advanced features for growing businesses",
      features: [
        "Company Formation",
        "Registered Agent",
        "Ein (Tax ID)",
        "Operating Agreement",
        "Standard Address",
        "Business Bank Account",
        "Priority Support",
        "Company Alerts",
      ],
      popular: true,
    },
    {
      name: "Business",
      price: pricing.business,
      description: "Complete solution for established businesses",
      features: [
        "Company Formation",
        "Registered Agent",
        "Ein (Tax ID)",
        "Operating Agreement",
        "Premium Address",
        "Business Bank Account",
        "Priority Support",
        "Company Alerts",
        "Free Annual Report",
        "Free Domain Name",
        "Business Website",
      ],
    },
  ]

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {plans.map((plan) => (
        <Card key={plan.name} className={plan.popular ? "border-primary" : ""}>
          <CardHeader>
            <CardTitle>{plan.name}</CardTitle>
            <div className="text-3xl font-bold">${plan.price}</div>
            <CardDescription>{plan.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

