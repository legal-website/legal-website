"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { Star, Check } from "lucide-react"
import { Swiper, SwiperSlide } from "swiper/react"
import { ScrollAnimation } from "./GlobalScrollAnimation";
import { Autoplay } from "swiper/modules"
import "swiper/css"

export default function CustomerSuccess() {
  const [count, setCount] = useState(10)
  const [businesses, setBusinesses] = useState(1)

  useEffect(() => {
    const timer = setInterval(() => {
      setCount((prev) => {
        if (prev >= 20) {
          clearInterval(timer)
          return 20
        }
        return prev + 1
      })
    }, 100)

    return () => clearInterval(timer)
  }, [])
  useEffect(() => {
    const businessesTimer = setInterval(() => {
      setBusinesses((prev) => {
        if (prev >= 4) {
          clearInterval(businessesTimer)
          return 4
        }
        return prev + 1
      })
    }, 500)

    return () => clearInterval(businessesTimer)
  }, [])
  const testimonials = [
    {
      text: "Orizen Inc made everything 10 times easier for my business. Fast, easy, and very professional.",
      name: "Luis C.",
      role: "LLC customer"
    },
    {
      text: "I couldn't believe how fast and professional the service was. Highly recommend!",
      name: "Jessica M.",
      role: "LLC customer"
    },
    {
      text: "Excellent service! They made the entire process seamless and stress-free.",
      name: "John D.",
      role: "LLC customer"
    }
  ]

  return (
    <div className="bg-white py-20 px-[10%]">
      <div className="container mx-auto">
        <h2 style={{ fontFamily: 'Montserrat', fontSize: '40px', fontWeight: '500' }} className="text-center mb-16 text-gray-900">
          How we&apos;ve helped our customers
        </h2>

        {/* Top Section - 2 columns */}
        <ScrollAnimation>
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="md:col-span-2">
            <Image src="/sec.webp" alt="Customers in store" width={800} height={400} className="rounded-2xl w-full h-[320px] object-cover" />
          </div>

          <div className="bg-[#ffe082] p-8 rounded-2xl relative cursor-grab">
            <Swiper
              modules={[Autoplay]}
              autoplay={{ delay: 1000, disableOnInteraction: false, pauseOnMouseEnter: false }}
              spaceBetween={30}
              slidesPerView={1}
              speed={1000}
              grabCursor={true}
              loop={true}
            >
              {testimonials.map((testimonial, index) => (
                <SwiperSlide key={index}>
                  <div className="text-6xl mb-6" style={{ fontFamily: 'Montserrat' }}>
                  &quot;
                  </div>
                  <p style={{ fontFamily: 'Nethead', fontSize: '16px' }} className="mb-4">{testimonial.text}</p>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">—{testimonial.name},</p>
                      <p style={{ fontFamily: 'Nethead', fontSize: '16px' }} className="text-gray-700">{testimonial.role}</p>
                    </div>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-current text-[#22c984]" />
                      ))}
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
          
        </div>
        </ScrollAnimation>
        

        {/* Bottom Section - 3 columns */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column */}
          <div className="col-span-3 space-y-8">
            <div className="bg-[#fff9e9] p-8 rounded-2xl">
              <h3 style={{ fontFamily: 'Montserrat', fontSize: '40px', fontWeight: '500' }} className="mb-2">4M+</h3>
              <p style={{ fontFamily: 'Nethead', fontSize: '20px' }} className="text-gray-700">businesses formed</p>
            </div>
            <Image
              src="/zec.webp"
              alt="Person on phone"
              width={400}
              height={200}
              className="rounded-2xl w-full h-[200px] object-cover"
            />
          </div>

          {/* Middle Column */}
          <div className="col-span-6 bg-gray-100 rounded-2xl p-8">
            <div className="text-6xl mb-6" style={{ fontFamily: 'Montserrat' }}>
            &quot;
            </div>
            <p style={{ fontFamily: 'Work Sans', fontSize: '16px' }} className="mb-4">
              I am a repeat customer and wouldn&apos;t trust anyone else with my business details.
            </p>
            <div className="flex justify-between items-center mb-8">
              <div>
                <p className="font-semibold">—Felicia L.,</p>
                <p style={{ fontFamily: 'Work Sans', fontSize: '16px' }} className="text-gray-700">LLC customer</p>
              </div>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current text-[#22c984]" />
                ))}
              </div>
            </div>
            <div className="space-y-4">
              {[1, 2].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div className="h-2 bg-gray-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column */}
          <div className="col-span-3 space-y-8">
            <div className="bg-gray-100 p-8 rounded-2xl flex items-center justify-center">
              <Image src="/lz.svg" alt="Orizen Inc Guarantee" width={120} height={120} className="w-24 h-24" />
            </div>
            <div className="bg-[#22c984] p-8 rounded-2xl text-white">
              <div style={{ fontFamily: 'Montserrat', fontSize: '40px', fontWeight: '500' }} className="mb-1">{count}+</div>
              <div style={{ fontFamily: 'Nethead', fontSize: '35px' , fontWeight: '500'}} className="text-2xl">years</div>
              <div style={{ fontFamily: 'Nethead', fontSize: '20px' }} className="text-sm">of LLC experience</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
