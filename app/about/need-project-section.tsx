"use client"

import { useEffect, useRef } from "react"
import { Phone } from "lucide-react"

export default function NeedProjectSection() {
  const personImageRef = useRef<HTMLImageElement>(null)
  const needProjectRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const personImage = personImageRef.current
    const needProject = needProjectRef.current
    if (!personImage || !needProject) return

    let scale = 1
    let growing = true

    const animate = () => {
      if (growing) {
        scale += 0.0005
        if (scale >= 1.05) growing = false
      } else {
        scale -= 0.0005
        if (scale <= 1) growing = true
      }

      if (personImage && needProject) {
        personImage.style.transform = `scale(${scale})`
        needProject.style.transform = `scale(${scale})`
      }
      requestAnimationFrame(animate)
    }

    const animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [])

  return (
    <section className="relative overflow-hidden">
      {/* Main Content Section */}
      <div className="relative bg-[#030b2c] overflow-hidden py-24">
        {/* Dotted Pattern Background */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: "radial-gradient(circle, #22c984 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          ></div>
        </div>

        <div className="container mx-auto px-[10%] pt-10 pb-36">
          <div className="flex justify-between items-center">
            {/* Left Content */}
            <div className="max-w-md space-y-8">
              <div className="relative inline-flex">
                <div className="absolute inset-0 border-2 border-[#22c984]/20 rounded-full"></div>
                <div className="w-16 h-16 rounded-full bg-[#22c984]/10 flex items-center justify-center relative">
                  <Phone className="w-6 h-6 text-[#22c984]" />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-medium text-white">Call Us Anytime</h3>
                <p className="text-4xl font-bold text-white tracking-tight">+123 456 (4567) 890</p>
                <p className="text-gray-400 max-w-sm">
                Expertly streamline collaborative strategies and implement industry-leading best practices for seamless LLC operations.
                </p>
              </div>

              <button className="px-16 py-3 bg-[#22c984] text-white rounded-md hover:bg-[#166544] transition-colors group flex items-center gap-2">
                Let&apos;s Talk
                <svg
                  className="w-5 h-5 transition-transform group-hover:translate-x-1"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Right Content */}
            <div className="relative flex-1 ml-8">
              <div className="absolute right-0 top-1/2 -translate-y-1/2">
              
                <div className="relative">
                  {/* Circular Background with Rings */}
                  <div className="w-[450px] h-[450px] rounded-full bg-[#22c984]/20">
            
                    <div className="absolute inset-4 rounded-full border-2 border-[#22c984]/10"></div>
                    <div className="absolute inset-8 rounded-full border-2 border-[#22c984]/10"></div>
                    <div className="absolute inset-12 rounded-full border-2 border-[#22c984]/10"></div>
                  </div>
                  </div>
                  {/* Person Image */}
                  <img
                    ref={personImageRef}
                    src="/contact-thumb.png"
                    alt="Contact support"
                    className="absolute right-0 top-1 max-w-[400px] transition-transform duration-300"
                  />

                  {/* Need Project Bubble */}
                  <img
                    ref={needProjectRef}
                    src="/need.png"
                    alt="Need Project?"
className="absolute right-[350px] top-[20px] w-52 animate-pulse"
  style={{ animationDuration: "0.8s" }}                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      

      {/* Statistics Bar */}
      <div className="relative mr-48 ml-48 bg-contain repeat-1 bg-center overflow-hidden" style={{ 
       backgroundImage: "url('/counter-bg.png')",
       borderRadius: "10px",
       marginTop: "-80px",
       zIndex: 10
     }}>
        <div className="mx-auto" style={{ maxWidth: "1050px" }} >
          <div className="grid grid-cols-4 divide-x divide-white">
            <StatItem number="960+" label="Active Customer" />
            <StatItem number="90+" label="Expert Members" />
            <StatItem number="852+" label="Satisfied Customers" />
            <StatItem number="100%" label="Satisfaction Rate" />
          </div>
        </div>
      </div>
    </section>
  )
}

function StatItem({ number, label }: { number: string; label: string }) {
  return (
    <div className="py-10 px-8 text-center">
      <h4 className="text-4xl font-bold text-white mb-2">{number}</h4>
      <p className="text-white/90">{label}</p>
    </div>
  )
}


