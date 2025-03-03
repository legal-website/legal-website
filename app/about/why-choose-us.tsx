"use client"
import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ShieldCheck } from "lucide-react"

export default function WhyChooseUs() {
  const router = useRouter()

  return (
    <section className="py-20 bg-gray-50 mb-16">
      <div className="container mx-auto px-[10%]">
        <div className="grid md:grid-cols-2 gap-16">
          {/* Left Column */}
          <div className="space-y-8">
            <div>
              <span className="text-[#22c984] font-medium">Why Choose Us?</span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 leading-tight">
              Building Your Path to Success with Reliable LLC Services.
              </h2>
              <p className="text-gray-600 mt-4 max-w-xl">
              Seamlessly synergize targeted markets and strategic opportunities. 
              Collaboratively shape innovative solutions with cutting-edge infrastructure for LLC growth.              </p>
            </div>

            <div className="space-y-6">
              <ProgressBar label="IT Solutions" percentage={95} />
              <ProgressBar label="Development" percentage={85} />
            </div>

            <button
              className="inline-flex items-center px-6 py-3 bg-[#22c984] text-black rounded-md hover:bg-[#166a47] hover:text-white transition-colors group"
              onClick={() => router.push('/states')}
            >
              Explore More States 
              <svg
                className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Right Column */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Business Plan Card */}
            <PriceCard
              title="STARTER Plan"
              price="199"
              features={["Company Formation", "Registered Agent", "Operating Agreement", "Lifetime Support"]}
              isPopular={false}
            />

            {/* Popular Plan Card */}
            <PriceCard
              title="Premium Plan"
              price="249"
              features={["Unique Address", "Payment Gateway Setup", "Business Bank Account", "Ein (Tax ID)"]}
              isPopular={true}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function ProgressBar({ label, percentage }: { label: string; percentage: number; }) {
  const progressRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const progressBar = progressRef.current
    if (progressBar) {
      progressBar.style.width = "10%"
      setTimeout(() => {
        progressBar.style.transition = "width 2.5s ease-in-out"
        progressBar.style.width = `${percentage}%`
      }, 100)
    }
  }, [percentage])

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-gray-900 flex items-center">
          <span className="mr-2"></span>
          {label}
        </span>
        <span className="text-[#000000]">{percentage}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          ref={progressRef}
          className="h-full bg-[#22c984] rounded-full transition-all duration-1000 ease-out"
          style={{ width: "10%" }}
        />
      </div>
    </div>
  )
}

function PriceCard({
  title,
  price,
  features,
  isPopular,
}: {
  title: string
  price: string
  features: string[]
  isPopular: boolean
}) {
  const baseClasses = "p-8 rounded-lg space-y-6 transition-all duration-300 shadow-md hover:shadow-xl"
  const regularClasses = "bg-white hover:bg-[#22c984] hover:text-white"
  const popularClasses = "bg-[#22c984] text-black hover:bg-green-500 hover:text-white"

  return (
    <div className={`${baseClasses} ${isPopular ? popularClasses : regularClasses}`}>
      <ShieldCheck className={`w-12 h-12 mx-auto ${isPopular ? "text-[#000000]" : "text-[#000000] hover:text-white"}`} />
      <div>
        <h3 className="text-xl font-bold hover:text-white">{title}</h3>
        <p className={`text-sm mt-1 hover:text-white`}>
          The markets and front market
        </p>
      </div>
      <div className="flex items-baseline">
        <span className="text-4xl font-bold hover:text-white">${price}</span>
        <span className={`ml-2 hover:text-white`}>
          / Month
        </span>
      </div>
      <ul className="space-y-4">
        {features.map((feature, index) => (
          <li key={index} className="hover:text-white">
            {feature}
          </li>
        ))}
      </ul>
      <button
        className={`w-full py-2.5 rounded transition-colors ${
          isPopular
            ? "bg-[#0d4e33] text-white hover:text-[#000000] hover:bg-[#c9ecdd] shadow-[0_6px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.5)] "
            : "bg-gray-100 text-gray-900 hover:bg-[#125338] hover:text-[#ffffff] shadow-[0_6px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.5)]  "
        }`}
      >
        Purchase
      </button>
    </div>
  )
}
