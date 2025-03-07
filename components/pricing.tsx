"use client"

import { Button } from "@/components/ui/button"
import { Check, ShieldCheck, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { ScrollAnimation } from "./GlobalScrollAnimation"
import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useCart } from "@/context/cart-context"

// State filing fees data with updated prices
const stateFilingFees = {
  Alabama: 230,
  Alaska: 250,
  Arizona: 50,
  Arkansas: 45,
  California: 70,
  Colorado: 50,
  Connecticut: 120,
  Delaware: 90,
  Florida: 125,
  Georgia: 100,
  Hawaii: 50,
  Idaho: 100,
  Illinois: 150,
  Indiana: 95,
  Iowa: 50,
  Kansas: 160,
  Kentucky: 40,
  Louisiana: 100,
  Maine: 175,
  Maryland: 100,
  Massachusetts: 500,
  Michigan: 50,
  Minnesota: 155,
  Mississippi: 50,
  Missouri: 50,
  Montana: 35,
  Nebraska: 100,
  Nevada: 425,
  "New Hampshire": 102,
  "New Jersey": 125,
  "New Mexico": 50,
  "New York": 200,
  "North Carolina": 125,
  "North Dakota": 135,
  Ohio: 99,
  Oklahoma: 100,
  Oregon: 100,
  Pennsylvania: 125,
  "Rhode Island": 150,
  "South Carolina": 110,
  "South Dakota": 150,
  Tennessee: 300,
  Texas: 300,
  Utah: 59,
  Vermont: 125,
  Virginia: 100,
  Washington: 200,
  "West Virginia": 100,
  Wisconsin: 130,
  Wyoming: 100,
  "District of Columbia": 220,
  "Puerto Rico": 150,
} as const

// State descriptions with annual report information
const stateDescriptions = {
  Alabama: "Annual Report: $50 (10th April)",
  Alaska: "Annual Report: $100 (every 2 years on 2nd Jan)",
  Arizona: "Annual Report: -",
  Arkansas: "Annual Report: $150 (1st May)",
  California: "Annual Report: $820 (360 Days)",
  Colorado: "Annual Report: $10 (360 Days)",
  Connecticut: "Annual Report: $80 (31st March)",
  Delaware: "Annual Report: $300 (20th May)",
  Florida: "Annual Report: $138.75 (1st May)",
  Georgia: "Annual Report: $50 (25th March)",
  Hawaii: "Annual Report: $15 (360 Days)",
  Idaho: "Annual Report: $0 (however, an information report must be filed after 360 Days)",
  Illinois: "Annual Report: $75 (360 Days)",
  Indiana: "Annual Report: $31 (720 Days)",
  Iowa: "Annual Report: $30 (every 2 years on 1st April)",
  Kansas: "Annual Report: $50 (15th April)",
  Kentucky: "Annual Report: $15 (30th June)",
  Louisiana: "Annual Report: $35 (360 Days)",
  Maine: "Annual Report: $85 (1st June)",
  Maryland: "Annual Report: $300 (10th April)",
  Massachusetts: "Annual Report: $500 (360 Days)",
  Michigan: "Annual Report: $25 (10th Feb)",
  Minnesota: "Annual Report: $0 (however, an information report must be filed on 20th December)",
  Mississippi: "Annual Report: $0 (however, an information report must be filed on 10th April)",
  Missouri: "Annual Report: -",
  Montana: "Annual Report: $20 (10th April)",
  Nebraska: "Annual Report: $10 (1st April)",
  Nevada: "Annual Report: $350 (360 Days)",
  "New Hampshire": "Annual Report: $100 (1st April)",
  "New Jersey": "Annual Report: $75 (360 Days)",
  "New Mexico": "Discount Fee: $40, Annual Report: -",
  "New York": "Annual Report: $9 (720 Days)",
  "North Carolina": "Annual Report: $200 (10th April)",
  "North Dakota": "Annual Report: $50 (10th Nov)",
  Ohio: "Annual Report: $99 (1st July)",
  Oklahoma: "Annual Report: $25 (1st July)",
  Oregon: "Annual Report: $100 (360 Days)",
  Pennsylvania: "Annual Report: $70 (15th April)",
  "Rhode Island": "Annual Report: $50 (1st Nov)",
  "South Carolina": "Annual Report: $25 (1st April)",
  "South Dakota": "Annual Report: $50 (1st Feb)",
  Tennessee: "Annual Report: $300 (1st April)",
  Texas: "Annual Report: $0 (however a Public Information Report must be filed by 10th May)",
  Utah: "Annual Report: $18 (360 Days)",
  Vermont: "Annual Report: $35 (1st April)",
  Virginia: "Annual Report: $50 (360 Days)",
  Washington: "Annual Report: $60 (360 Days)",
  "West Virginia": "Annual Report: $25 (1st July)",
  Wisconsin: "Annual Report: $25 (31st March)",
  Wyoming: "Discount Fee: $80, Annual Report: $60 (360 Days)",
  "District of Columbia": "Annual Report: $300 (1st April)",
  "Puerto Rico": "Annual Report: $150 (15th April)",
} as const

// Special discounts for some states
const stateDiscounts = {
  "New Mexico": 40,
  Wyoming: 80,
} as const

interface PricingFeature {
  text: string
}

interface PricingTier {
  name: string
  price: number
  description: string
  features: PricingFeature[]
  isRecommended?: boolean
  includesPackage?: string
  hasAssistBadge?: boolean
}


const pricingTiers: PricingTier[] = [
  {
    name: "STARTER",
    price: 129,
    description: "Includes the filing of Articles of Org to officially establish and Orizenly recognize your (LLC).",
    features: [
      { text: "Company Formation" },
      { text: "Registered Agent" },
      { text: "Ein (Tax ID)" },
      { text: "Operating Agreement" },
      { text: "FinCEN BOI" },
      { text: "Standard Address" },
      { text: "Lifetime Support " },
      { text: "Company Alerts " },
      { text: "Dedicated Dashboard " },
    ],
  },
  {
    name: "STANDARD",
    price: 199,
    description: "Best for those planning to start and operate a business or side hustle.",
    isRecommended: true,
    includesPackage: "Basic",
    features: [
      { text: "Company Formation" },
      { text: "Registered Agent" },
      { text: "Ein (Tax ID)" },
      { text: "Operating Agreement" },
      { text: "FinCEN BOI" },
      { text: "Standard Address" },
      { text: "Business Bank Account" },
      { text: "Priority Support " },
      { text: "Company Alerts" },
      { text: "Dedicated Dashboard" },
    ],
  },
  {
    name: "Premium",
    price: 249,
    description: "Best for those who want an experienced attorney to ensure they get everything right.",
    includesPackage: "Pro",
    hasAssistBadge: true,
    features: [
      { text: "Company Formation" },
      { text: "Registered Agent" },
      { text: "Ein (Tax ID)" },
      { text: "Operating Agreement" },
      { text: "FinCEN BOI" },
      { text: "Unique Address" },
      { text: "Business Bank Account" },
      { text: "Priority Support " },
      { text: "Payment Gateway Setup" },
      { text: "Free Business Website" },
      { text: "Dedicated Dashboard" },
      { text: "Free Annual Report(1yr)" },
      { text: "Free .Com Domain" },
    ],
  },
]

export default function PricingCards() {
  const router = useRouter()
  const { toast } = useToast()
  const [selectedState, setSelectedState] = useState<keyof typeof stateFilingFees | "">("")
  const { addItem, isInCart } = useCart()

  const handleButtonClick = () => {
    router.push("/states")
  }

  const resetState = () => {
    setSelectedState("")
  }

  const calculateTotalPrice = (basePrice: number) => {
    if (!selectedState) return basePrice;
  
    const stateFee = stateFilingFees[selectedState];
    const discountedFee = stateDiscounts[selectedState as keyof typeof stateDiscounts] || stateFee;
    const discount = stateFee - discountedFee;
  
    return basePrice + stateFee - discount;
  };
  
  const hasDiscount = (state: keyof typeof stateFilingFees) => {
    return state in stateDiscounts;
  };

  const handleAddToCart = (tier: PricingTier) => {
    // If already in cart, go to checkout
    if (isInCart(tier.name, selectedState)) {
      router.push("/checkout")
      return
    }

    // Otherwise add to cart
    interface CartItem {
      tier: string
      price: number
      state?: keyof typeof stateFilingFees
      stateFee?: number
      discount?: number
    }
    
    const newItem: CartItem = {
      tier: tier.name,
      price: tier.price,
    }
    

    if (selectedState) {
      newItem.state = selectedState
      newItem.stateFee = stateFilingFees[selectedState]

      if (hasDiscount(selectedState)) {
        newItem.discount = stateDiscounts[selectedState as keyof typeof stateDiscounts]
      }
    }

    addItem(newItem)

    toast({
      title: "Added to cart",
      description: `${tier.name} package${selectedState ? ` for ${selectedState}` : ""} has been added to your cart.`,
    })
  }

  return (
    <ScrollAnimation>
      <div className="max-w-[90%] mx-auto px-[5%] py-8">
        {/* Cart indicator */}
        {/* {cartItems.length > 0 && (
          <div className="fixed top-4 right-4 z-50">
            <Button
              onClick={() => router.push("/cart")}
              className="bg-[#22c984] hover:bg-[#1eac73] text-white rounded-full p-3"
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="ml-2">{cartItems.length}</span>
            </Button>
          </div>
        )} */}

        {/* State Selection Dropdown */}
        <div className="mb-8 max-w-xs mx-auto relative">
          <div className="flex items-center">
            <div className="flex-grow">
              <Select onValueChange={(value) => setSelectedState(value as keyof typeof stateFilingFees)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your state" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(stateFilingFees)
                    .sort()
                    .map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reset button */}
            {selectedState && (
              <Button
                variant="ghost"
                size="icon"
                className="ml-2 h-10 w-10 rounded-full hover:bg-gray-100"
                onClick={resetState}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Reset state selection</span>
              </Button>
            )}
          </div>

          {selectedState && (
            <div className="mt-2 text-sm text-gray-600 text-center">
              <div className="font-medium">State filing fee: ${stateFilingFees[selectedState]}</div>
              {hasDiscount(selectedState) && (
                <div className="text-[#22c984] font-medium">
                  After Including discount: ${stateDiscounts[selectedState as keyof typeof stateDiscounts]}
                </div>
              )}
              <div className="mt-1">{stateDescriptions[selectedState]}</div>
            </div>
          )}
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid md:grid-cols-3 gap-[30px]">
          {pricingTiers.map((tier, index) => (
            <div
              key={tier.name}
              className={`relative border rounded-lg p-6 bg-white transition duration-300 ease-in-out transform hover:scale-105 ${
                tier.isRecommended ? "border-[#22c984]" : "border-gray-200"
              } ${index === 1 ? "hover:border-black" : "hover:border-[#22c984]"} hover:shadow-lg`}
            >
              {tier.isRecommended && (
                <div className="absolute top-[-10px] right-[-10px] bg-[#22c984] text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
                  RECOMMENDED
                </div>
              )}
              <div className="mb-4 flex items-center justify-center gap-2">
                <h3 style={{ fontFamily: "Montserrat", fontWeight: "500", fontSize: "22px" }}>{tier.name}</h3>
                {tier.hasAssistBadge && (
                  <div className="flex items-center bg-gray-200 text-sm font-medium text-gray-800 px-2 py-1 rounded-lg">
                    <ShieldCheck className="h-4 w-4 text-black mr-1" />
                    ASSIST
                  </div>
                )}
              </div>
              <div className="mb-4">
  <span className="text-3xl font-normal">
    {selectedState && hasDiscount(selectedState) ? (
      <>
        <del className="text-[#22c984] mr-2">
          ${tier.price + stateFilingFees[selectedState as keyof typeof stateFilingFees]}
        </del>
        ${calculateTotalPrice(tier.price)}
      </>
    ) : (
      `$${calculateTotalPrice(tier.price)}`
    )}
  </span>
  {selectedState ? (
    <div className="text-sm text-gray-600 mt-1">
      <div>
        <span className="text-[#323232]">
          Base price: ${tier.price} + State fee: ${stateFilingFees[selectedState as keyof typeof stateFilingFees]}
        </span>
        {hasDiscount(selectedState) && (
          <span className="text-[#000000]" style={{ textDecoration: 'underline', textDecorationColor: 'red' }}>
          {" "}
            - Discounted Price: ${stateDiscounts[selectedState as keyof typeof stateDiscounts]}
          </span>
        )}
      </div>
    </div>
  ) : (
    <span className="text-gray-600 ml-2">+ state filing fees</span>
  )}
</div>

              <p style={{ fontFamily: "Nethead", fontSize: "16px", color: "#4A4A4A" }} className="mb-6">
                {tier.description}
              </p>

              {/* Single action button that changes based on cart state */}
              <Button
                style={{ fontFamily: "Nethead", fontSize: "16px" }}
                className="w-full bg-[#22c984] hover:bg-[#1eac73] text-white hover:text-black mb-6"
                onClick={() => handleAddToCart(tier)}
              >
                {isInCart(tier.name, selectedState) ? "Buy Now" : "Add to Cart"}
              </Button>

              <div className="space-y-4">
                {tier.includesPackage && (
                  <p style={{ fontFamily: "nethead", fontSize: "16px" }}>
                    Includes <span className="font-bold">{tier.includesPackage}</span> package, plus:
                  </p>
                )}
                {!tier.includesPackage && <p style={{ fontFamily: "nethead", fontSize: "16px" }}>Includes:</p>}
                {tier.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex gap-3">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                    <span style={{ fontFamily: "nethead", fontSize: "16px", color: "#4A4A4A" }}>{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </ScrollAnimation>
  )
}

