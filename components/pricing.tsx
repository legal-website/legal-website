"use client";  // Add this line at the very top
import { Button } from '@/components/ui/button'
import { Check, ShieldCheck } from "lucide-react"
import { useRouter } from 'next/navigation'  // Import useRouter
import { ScrollAnimation } from "./GlobalScrollAnimation";

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
        price: 199,
        description: "Includes the filing of Articles of Org to officially establish and Orizenly recognize your (LLC).",
        features: [
            {
                text: "Company Formation",
            },
            {
                text: "Registered Agent",
            },
            {
                text: "Ein (Tax ID)",
            },
            {
                text: "Operating Agreement",
            },
            {
                text: "FinCEN BOI",
            },
            {
                text: "Shared Address",
            },
            {
                text: "Lifetime Support ",
            },
            {
                text: "Company Alerts ",
            },
            {
                text: "Dedicated Dashboard ",
            },
        ],
    },
    {
        name: "STANDARD",
        price: 129,
        description: "Best for those planning to start and operate a business or side hustle.",
        isRecommended: true,
        includesPackage: "Basic",
        features: [
            {
                text: "Company Formation",
            },
            {
                text: "Registered Agent",
            },
            {
                text: "Ein (Tax ID)",
            },
            {
                text: "Operating Agreement",
            },
            {
                text: "FinCEN BOI",
            },
            {
                text: "Shared Address",
            },
            {
                text: "Business Bank Account",
            },
            {
                text: "Priority Support ",
            },
            {
                text: "Company Alerts",
            },
            {
                text: "Dedicated Dashboard",
            },
           
        ],
    },
    {
        name: "Premium",
        price: 249,
        description: "Best for those who want an experienced attorney to ensure they get everything right.",
        includesPackage: "Pro",
        hasAssistBadge: true,
        features: [
            {
                text: "Company Formation",
            },
            {
                text: "Registered Agent",
            },
            {
                text: "Ein (Tax ID)",
            },
            {
                text: "Operating Agreement",
            },
            {
                text: "FinCEN BOI",
            },
            {
                text: "Unique Address",
            },
            {
                text: "Business Bank Account",
            },
            {
                text: "Priority Support ",
            },
            {
                text: "Payment Gateway Setup",
            },
            {
                text: "Free Business Website",
            },
            {
                text: "Dedicated Dashboard",
            },
            {
                text: "Free Annual Report(1yr)",
            },
            {
                text: "Free .Com Domain",
            },
           
        ],
    },
]

export default function PricingCards() {
    const router = useRouter();  // Initialize router

    const handleButtonClick = () => {
        router.push('/states');  // Navigate to page.tsx
    }
    return (
        <ScrollAnimation>
        <div id="pricing-section" className="grid md:grid-cols-3 gap-[30px] max-w-[90%] mx-auto px-[5%] py-8">
            {pricingTiers.map((tier, index) => (
                <div
                    key={tier.name}
                    className={`relative border rounded-lg p-6 bg-white transition duration-300 ease-in-out transform hover:scale-105 ${tier.isRecommended ? "border-[#22c984]" : "border-gray-200"} ${index === 1 ? "hover:border-black" : "hover:border-[#22c984]"} hover:shadow-lg`}
                >
                    {tier.isRecommended && (
                        <div className="absolute top-[-10px] right-[-10px] bg-[#22c984] text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
                            RECOMMENDED
                        </div>
                    )}
                    <div className="mb-4 flex items-center justify-center gap-2">
                        <h3 style={{ fontFamily: 'Montserrat', fontWeight: '500', fontSize: '22px' }}>{tier.name}</h3>
                        {tier.hasAssistBadge && (
                            <div className="flex items-center bg-gray-200 text-sm font-medium text-gray-800 px-2 py-1 rounded-lg">
                                <ShieldCheck className="h-4 w-4 text-black mr-1" />
                                ASSIST
                            </div>
                        )}
                    </div>
                    <div className="mb-4">
                        <span className="text-3xl font-bold">${tier.price}</span>
                        <span className="text-gray-600 ml-2">+ state filing fees</span>
                    </div>
                    <p style={{ fontFamily: 'Nethead', fontSize: '16px', color: '#4A4A4A' }} className="mb-6">{tier.description}</p>
                    <Button style={{ fontFamily: 'Nethead', fontSize: '16px' }} className="w-full bg-[#22c984] hover:bg-[#1eac73] text-white mb-6 hover:text-black">Form my LLC</Button>
                    <div className="space-y-4">
                        {tier.includesPackage && (
                            <p style={{ fontFamily: 'nethead', fontSize: '16px' }}>
                                Includes <span className="font-bold">{tier.includesPackage}</span> package, plus:
                            </p>
                        )}
                        {!tier.includesPackage && <p style={{ fontFamily: 'nethead', fontSize: '16px' }}>Includes:</p>}
                        {tier.features.map((feature, featureIndex) => (
                            <div key={featureIndex} className="flex gap-3">
                                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                                <span style={{ fontFamily: 'nethead', fontSize: '16px', color: '#4A4A4A' }}>{feature.text}</span>
                            </div>
                        ))}
                    </div>

                    {/* New Button at the End */}
            
                </div>
            ))}
            <section className="mt-2">
  <div className="mt-0 flex">
    <Button 
      onClick={handleButtonClick} 
      className="bg-[#22c984] text-white text-[16px] hover:bg-[#1eac73] hover:text-black px-[110px] ml-[420px]">
      Explore State-Wise Pricing & Features – Find the Best Plans Tailored for You!
    </Button>
  </div>
  
</section>

        </div>
        </ScrollAnimation>
        
    )
}
