"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, HelpCircle } from "lucide-react"
import { usePricing } from "@/context/pricing-context"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function PricingCards() {
  const { pricingData } = usePricing()
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual" | "one-time">("one-time")

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Choose the plan that works best for your business needs. All plans include our core features.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {pricingData.plans.map((plan, index) => (
          <Card
            key={index}
            className={`flex flex-col h-full ${
              plan.isRecommended ? "border-2 border-primary shadow-lg" : "border border-gray-200"
            }`}
          >
            {plan.isRecommended && (
              <div className="bg-primary text-primary-foreground text-center py-1 text-sm font-medium">RECOMMENDED</div>
            )}
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription className="mt-1">{plan.description}</CardDescription>
                </div>
                {plan.hasAssistBadge && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    ASSIST
                  </Badge>
                )}
              </div>
              <div className="mt-4">
                <span className="text-3xl font-bold">{plan.displayPrice}</span>
                {plan.billingCycle !== "one-time" && (
                  <span className="text-gray-500 dark:text-gray-400 ml-1">
                    /{plan.billingCycle === "monthly" ? "mo" : "yr"}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-2">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="flex flex-col items-stretch pt-6">
              <Button className="w-full" variant={plan.isRecommended ? "default" : "outline"}>
                Get Started
              </Button>
              {plan.includesPackage && (
                <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center">
                  <span>Includes {plan.includesPackage} package</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 ml-1 cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-64">
                          The {plan.includesPackage} package includes additional services and benefits to help your
                          business succeed.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>
          All prices are in USD and don't include state filing fees. See our{" "}
          <a href="#" className="text-primary underline">
            pricing details
          </a>{" "}
          for more information.
        </p>
      </div>
    </div>
  )
}

