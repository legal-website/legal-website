"use client"

import { usePricing } from "@/context/pricing-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export function PricingCards() {
  const { pricingData, loading } = usePricing()

  if (loading) {
    return <div className="text-center py-10">Loading pricing information...</div>
  }

  return (
    <div className="container mx-auto py-10">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold mb-4">Choose Your Plan</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Select the perfect plan for your business needs. All plans include our core services to get your LLC up and
          running.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {pricingData.plans.map((plan) => (
          <Card key={plan.id} className={cn("flex flex-col h-full", plan.isRecommended && "border-primary shadow-lg")}>
            <CardHeader>
              {plan.isRecommended && <Badge className="w-fit mb-2">Recommended</Badge>}
              <CardTitle>{plan.name}</CardTitle>
              <div className="flex items-end gap-1">
                <span className="text-3xl font-bold">{plan.displayPrice}</span>
                <span className="text-muted-foreground mb-1">
                  {plan.billingCycle === "monthly" ? "/month" : "one-time"}
                </span>
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-2">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Select Plan</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default PricingCards

