"use client"

import { Check, HelpCircle, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useState } from "react"
import { ScrollAnimation } from "./GlobalScrollAnimation"

interface FeatureItem {
  name: string
  tooltip?: string
  basic: boolean | string
  pro: boolean | string
  premium: boolean | string
}

interface FeatureCategory {
  category: string
  items: FeatureItem[]
}

const features: FeatureCategory[] = [
  {
    category: "Business formation basics",
    items: [
      {
        name: "Articles of organization",
        tooltip: "Official document filed with the state to form your LLC",
        basic: true,
        pro: true,
        premium: true,
      },
      {
        name: "Name check service",
        tooltip: "Verify your business name availability",
        basic: true,
        pro: true,
        premium: true,
      },
      {
        name: "Business filing service",
        tooltip: "Complete filing service with the state",
        basic: true,
        pro: true,
        premium: true,
      },
      {
        name: "Digital welcome packet",
        tooltip: "Comprehensive guide to your new LLC",
        basic: true,
        pro: true,
        premium: true,
      },
    ],
  },
  {
    category: "Compliance essentials",
    items: [
      {
        name: "Operating agreement",
        tooltip: "Orizen document outlining your LLC&apos;s ownership and operating procedures",
        basic: false,
        pro: true,
        premium: true,
      },
      {
        name: "Federal Tax ID Number (EIN)",
        tooltip: "Required for tax filing and hiring employees",
        basic: false,
        pro: true,
        premium: true,
      },
      {
        name: "Financial account authorization letter",
        tooltip: "Helps you open business bank accounts",
        basic: false,
        pro: true,
        premium: true,
      },
    ],
  },
  {
    category: "Small business & insurance guidance",
    items: [
      {
        name: "Personalized business insurance quote from NEXT",
        tooltip: "Custom insurance recommendations for your business",
        basic: true,
        pro: true,
        premium: true,
      },
      {
        name: "Consultation with a small business specialist",
        tooltip: "Expert guidance for your business needs",
        basic: true,
        pro: true,
        premium: true,
      },
      {
        name: "1-800Accountant consult to discuss tax savings services",
        tooltip: "Professional tax planning advice",
        basic: true,
        pro: true,
        premium: true,
      },
    ],
  },
  {
    category: "Attorney guidance",
    items: [
      {
        name: "Unlimited 30-minute attorney consultations about new and unique Orizen topics or issues",
        tooltip: "Access to Orizen expertise when you need it",
        basic: false,
        pro: false,
        premium: "30-day subscription included†",
      },
      {
        name: "Attorney review of your Orizen contracts & documents",
        tooltip: "Professional Orizen document review",
        basic: false,
        pro: false,
        premium: "30-day subscription included†",
      },
    ],
  },
  {
    category: "Additional business services",
    items: [
      {
        name: "Send invoices, track expenses, and maximize tax deductions with our bookkeeping app",
        tooltip: "Complete financial management tools",
        basic: false,
        pro: "1 year subscription included†",
        premium: "1 year subscription included†",
      },
      {
        name: "Customizable website powered by WIX",
        tooltip: "Professional website builder",
        basic: false,
        pro: true,
        premium: true,
      },
      {
        name: "Library of 150+ downloadable Orizen forms",
        tooltip: "Access to essential Orizen documents",
        basic: false,
        pro: true,
        premium: true,
      },
      {
        name: "One year editor access to customize any of our Orizen forms",
        tooltip: "Customize Orizen documents for your needs",
        basic: false,
        pro: true,
        premium: true,
      },
      {
        name: "One year of access to eSignature",
        tooltip: "Digital document signing",
        basic: false,
        pro: true,
        premium: true,
      },
      {
        name: "One entity amendment with rush service included for 30 days",
        tooltip: "Quick changes to your LLC documents",
        basic: false,
        pro: true,
        premium: true,
      },
      {
        name: "One copyright registration per month",
        tooltip: "Protect your intellectual property",
        basic: false,
        pro: false,
        premium: "30-day subscription included†",
      },
    ],
  },
  {
    category: "Support",
    items: [
      {
        name: "Available support channels",
        basic: "Chat & phone",
        pro: "Chat & phone",
        premium: "Chat & phone",
      },
    ],
  },
]

export default function DetailedFeatures() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <ScrollAnimation>
      <TooltipProvider>
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full mt-[30px] overflow-x-hidden">
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              className="mx-auto block w-[80%] sm:w-auto px-4 sm:px-20 py-2 my-6 text-sm sm:text-base font-normal shadow-lg hover:shadow-md rounded-lg hover:bg-[#22c984] hover:text-white transition-all"
            >
              {isOpen ? "Hide detailed features" : "See detailed features"}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 sm:mt-8">
            <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-8">
              <div className="bg-white rounded-lg border shadow-lg overflow-x-auto">
                <div className="min-w-[640px]">
                  {" "}
                  {/* Set minimum width for scrollable content */}
                  <div className="grid grid-cols-4 gap-2 sm:gap-4 p-3 sm:p-7 border-b">
                    <h2 className="fontFamily: 'Montserrat' text-sm sm:text-xl font-600">What&apos;s included</h2>
                    <div className="fontFamily: 'Montserrat' text-center text-xs sm:text-base font-medium">Basic</div>
                    <div className="fontFamily: 'Montserrat' text-center text-xs sm:text-base font-medium">Pro</div>
                    <div className="fontFamily: 'Montserrat' text-center text-xs sm:text-base font-medium flex items-center justify-center gap-1 sm:gap-2">
                      Premium{" "}
                      <span className="text-[10px] sm:text-xs bg-black text-white px-1 sm:px-2 py-0.5 rounded">
                        ASSIST
                      </span>
                    </div>
                  </div>
                  <div className="divide-y">
                    {features.map((section) => (
                      <div key={section.category} className="p-3 sm:p-6">
                        <h3 className="fontFamily: 'Nethead' text-sm sm:text-base font-normal mb-2 sm:mb-4 fontSize: '15px'">
                          {section.category}
                        </h3>
                        <div className="space-y-2 sm:space-y-4">
                          {section.items.map((item) => (
                            <div key={item.name} className="grid grid-cols-4 gap-2 sm:gap-4 items-center">
                              <div className="flex items-center gap-1 sm:gap-3 text-xs sm:text-sm md:text-base pr-1">
                                <div className="break-words">{item.name}</div>
                                {item.tooltip && (
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <HelpCircle className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="max-w-[200px] sm:max-w-xs text-xs sm:text-sm">{item.tooltip}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                              <div className="text-center">
                                {typeof item.basic === "boolean" ? (
                                  item.basic ? (
                                    <Check className="mx-auto h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                                  ) : (
                                    <Minus className="mx-auto h-4 w-4 sm:h-5 sm:w-5 text-gray-300" />
                                  )
                                ) : (
                                  <span className="text-xs sm:text-sm">{item.basic}</span>
                                )}
                              </div>
                              <div className="text-center">
                                {typeof item.pro === "boolean" ? (
                                  item.pro ? (
                                    <Check className="mx-auto h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                                  ) : (
                                    <Minus className="mx-auto h-4 w-4 sm:h-5 sm:w-5 text-gray-300" />
                                  )
                                ) : (
                                  <span className="text-xs sm:text-sm">{item.pro}</span>
                                )}
                              </div>
                              <div className="text-center">
                                {typeof item.premium === "boolean" ? (
                                  item.premium ? (
                                    <Check className="mx-auto h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                                  ) : (
                                    <Minus className="mx-auto h-4 w-4 sm:h-5 sm:w-5 text-gray-300" />
                                  )
                                ) : (
                                  <span className="text-xs sm:text-sm">{item.premium}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleContent>
          {isOpen && (
            <Button
              variant="outline"
              className="mx-auto block w-[80%] sm:w-auto px-4 sm:px-20 py-2 my-6 text-sm sm:text-base font-normal shadow-lg hover:shadow-md rounded-lg hover:bg-[#22c984] hover:text-white transition-all"
              onClick={() => setIsOpen(false)}
            >
              Hide detailed features
            </Button>
          )}
        </Collapsible>
      </TooltipProvider>
    </ScrollAnimation>
  )
}

