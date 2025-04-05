"use client"
import Image from "next/image"
import { useEffect, useState } from "react"
import { Star, Check } from "lucide-react"
import { Swiper, SwiperSlide } from "swiper/react"
import { ScrollAnimation } from "./GlobalScrollAnimation"
import { Autoplay } from "swiper/modules"
import "swiper/css"

export default function CustomerSuccess() {
  const [count, setCount] = useState(10)

  useEffect(() => {
    const timer = setInterval(() => {
      setCount((prev) => {
        if (prev >= 8) {
          clearInterval(timer)
          return 8
        }
        return prev + 1
      })
    }, 100)

    return () => clearInterval(timer)
  }, [])

  const testimonials = [
    {
      text: "Orizen Inc made everything 10 times easier for my business. Fast, easy, and very professional.",
      name: "Luis C.",
      role: "LLC customer",
    },
    {
      text: "I couldn't believe how fast and professional the service was. Highly recommend!",
      name: "Jessica M.",
      role: "LLC customer",
    },
    {
      text: "Excellent service! They made the entire process seamless and stress-free.",
      name: "John D.",
      role: "LLC customer",
    },
  ]

  return (
    <div className="bg-white py-10 sm:py-14 md:py-20 px-4 sm:px-6 md:px-8 lg:px-[10%] overflow-x-hidden">
      <div className="container mx-auto">
        <h2
          className="text-center mb-8 sm:mb-12 md:mb-16 text-gray-900 text-2xl sm:text-3xl md:text-4xl font-medium"
          style={{ fontFamily: "Montserrat" }}
        >
          How we&apos;ve helped our customers
        </h2>

        {/* Top Section - responsive grid */}
        <ScrollAnimation>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
            <div className="md:col-span-2">
              <Image
                src="/sec.webp"
                alt="Customers in store"
                width={800}
                height={400}
                className="rounded-lg sm:rounded-xl md:rounded-2xl w-full h-[200px] sm:h-[250px] md:h-[320px] object-cover"
              />
            </div>

            <div className="bg-[#ffe082] p-4 sm:p-6 md:p-8 rounded-lg sm:rounded-xl md:rounded-2xl relative cursor-grab">
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
                    <div
                      className="text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4 md:mb-6"
                      style={{ fontFamily: "Montserrat" }}
                    >
                      &quot;
                    </div>
                    <p className="mb-3 sm:mb-4 text-sm sm:text-base break-words" style={{ fontFamily: "Nethead" }}>
                      {testimonial.text}
                    </p>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <div>
                        <p className="font-medium text-sm sm:text-base">—{testimonial.name},</p>
                        <p className="text-gray-700 text-xs sm:text-sm" style={{ fontFamily: "Nethead" }}>
                          {testimonial.role}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 fill-current text-[#22c984]" />
                        ))}
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>
        </ScrollAnimation>

        {/* Bottom Section - responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Left Column */}
          <div className="sm:col-span-1 lg:col-span-3 space-y-4 sm:space-y-6 md:space-y-8">
            <div className="bg-[#fff9e9] p-4 sm:p-6 md:p-8 rounded-lg sm:rounded-xl md:rounded-2xl">
              <h3
                className="text-2xl sm:text-3xl md:text-4xl mb-1 sm:mb-2 font-medium"
                style={{ fontFamily: "Montserrat" }}
              >
                7500+
              </h3>
              <p className="text-gray-700 text-sm sm:text-base md:text-lg" style={{ fontFamily: "Nethead" }}>
                businesses formed
              </p>
            </div>
            <Image
              src="/zec.webp"
              alt="Person on phone"
              width={400}
              height={200}
              className="rounded-lg sm:rounded-xl md:rounded-2xl w-full h-[150px] sm:h-[180px] md:h-[200px] object-cover"
            />
          </div>

          {/* Middle Column */}
          <div className="sm:col-span-1 lg:col-span-6 bg-gray-100 rounded-lg sm:rounded-xl md:rounded-2xl p-4 sm:p-6 md:p-8">
            <div className="text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4 md:mb-6" style={{ fontFamily: "Montserrat" }}>
              &quot;
            </div>
            <p className="mb-3 sm:mb-4 text-sm sm:text-base break-words" style={{ fontFamily: "Work Sans" }}>
              I am a repeat customer and wouldn&apos;t trust anyone else with my business details.
            </p>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4 sm:mb-6 md:mb-8">
              <div>
                <p className="font-semibold text-sm sm:text-base">—Felicia L.,</p>
                <p className="text-gray-700 text-xs sm:text-sm" style={{ fontFamily: "Work Sans" }}>
                  LLC customer
                </p>
              </div>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 fill-current text-[#22c984]" />
                ))}
              </div>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {[1, 2].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <div className="h-1.5 sm:h-2 bg-gray-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column */}
          <div className="sm:col-span-2 lg:col-span-3 grid grid-cols-2 sm:grid-cols-1 gap-4 sm:gap-6 md:gap-8 lg:space-y-8 lg:block">
            <div className="bg-gray-100 p-4 sm:p-6 md:p-8 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center">
              <Image
                src="/ori.svg"
                alt="Orizen Inc Guarantee"
                width={120}
                height={120}
                className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24"
              />
            </div>
            <div className="bg-[#22c984] p-4 sm:p-6 md:p-8 rounded-lg sm:rounded-xl md:rounded-2xl text-white">
              <div
                className="text-2xl sm:text-3xl md:text-4xl mb-0.5 sm:mb-1 font-medium"
                style={{ fontFamily: "Montserrat" }}
              >
                {count}+
              </div>
              <div className="text-xl sm:text-2xl font-medium" style={{ fontFamily: "Nethead" }}>
                years
              </div>
              <div className="text-xs sm:text-sm" style={{ fontFamily: "Nethead" }}>
                of LLC experience
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

