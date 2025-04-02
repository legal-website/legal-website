"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Phone } from "lucide-react"
import { ScrollAnimation } from "./GlobalScrollAnimation"

export default function Hero() {
  // Your actual Trustpilot data
  const rating = 4.2 // Your average rating
  const reviewCount = 6 // Your total number of reviews

  // Function to render stars with proper type annotation
  const renderStars = (rating: number) => {
    const stars = []
    const fullStars = Math.floor(rating)

    // Create full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <span key={`full-${i}`} className="text-[#00B67A]">
          ★
        </span>,
      )
    }

    // Create empty stars
    for (let i = fullStars; i < 5; i++) {
      stars.push(
        <span key={`empty-${i}`} className="text-gray-300">
          ★
        </span>,
      )
    }

    return stars
  }

  return (
    <ScrollAnimation>
      <div className="bg-[#FAF8F6] py-4 sm:py-6 md:py-10 px-3 sm:px-4 md:px-[5%]">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-6 md:gap-10 items-center">
            {/* Left Section - Text & Trustpilot */}
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-semibold mb-3 sm:mb-5 leading-tight text-gray-900">
                Start your LLC{" "}
                <span className="md:block">
                  with <span className="italic font-bold">confidence</span>
                </span>
              </h1>
              <p className="text-base sm:text-lg mb-4 sm:mb-5 leading-relaxed text-gray-700">
                Whether you&apos;re ready to form an LLC on your own or want advice every step of the way we&apos;ve got
                your back.
              </p>

              {/* Contact Info */}
              <div className="mb-4 sm:mb-6">
                <p className="flex items-center text-gray-800 text-sm sm:text-base md:text-lg">
                  <Phone className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-gray-700 flex-shrink-0" />
                  <span>
                    Have questions? Call <span className="font-bold whitespace-nowrap">(833) 799-4891</span> to speak
                    with a business specialist.
                  </span>
                </p>
              </div>

              {/* Trustpilot Rating - Text-based approach */}
              <div className="mb-4 sm:mb-6 flex items-center">
                {/* Trustpilot Text */}
                <a
                  href="https://www.trustpilot.com/review/orizeninc.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center"
                >
                  <span className="font-bold text-[#00B67A] mr-2 text-sm">TRUSTPILOT</span>

                  {/* Star Rating */}
                  <span className="flex items-center text-lg mr-2">{renderStars(rating)}</span>

                  {/* Rating Text */}
                  <span className="text-sm font-medium text-gray-700">
                    {rating} | {reviewCount} reviews
                  </span>
                </a>
              </div>
            </div>

            {/* Right Section - Image & Testimonial */}
            <div className="relative h-[300px] sm:h-[350px] md:h-[450px] rounded-xl overflow-hidden shadow-lg mt-4 md:mt-0">
              <Image
                src="/hero.webp"
                alt="Business Confidence"
                fill
                style={{ objectFit: "cover" }}
                className="rounded-xl"
                priority
              />

              {/* Round Stamp with Rotation */}
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 md:top-6 md:left-6 w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 bg-[#00b67956] rounded-full flex items-center justify-center shadow-lg p-2">
                <div className="rounded-full w-[calc(100%-16px)] h-[calc(100%-16px)] flex items-center justify-center overflow-hidden">
                  <Image
                    src="/shape.png"
                    alt="Certified"
                    width={150}
                    height={150}
                    className="rounded-full animate-rotate-slow w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Testimonial Card */}
              <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl md:rounded-2xl shadow-lg absolute right-3 bottom-3 sm:right-4 sm:bottom-4 md:right-6 md:bottom-6 max-w-[180px] sm:max-w-[220px] md:max-w-sm">
                <p className="text-gray-800 text-xs sm:text-sm md:text-lg italic leading-tight sm:leading-relaxed">
                  Orizen was an incredible partner. My business feels so sound that I can&apos;t wait to hire more
                  people... and have Orizen there with me as I grow.
                </p>
                <div className="mt-2 md:mt-4">
                  <p className="font-semibold text-gray-900 text-xs sm:text-sm md:text-base">Shannon Greevy</p>
                  <p className="text-xs md:text-sm text-gray-600">LLC customer</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons Section */}
        <div className="container mx-auto mt-4 sm:mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <Button
              variant="secondary"
              className="py-3 sm:py-4 md:py-5 text-sm sm:text-base md:text-lg rounded-lg md:rounded-xl bg-gray-100 hover:bg-gray-200 shadow-md"
            >
              I can do most of the work myself
            </Button>
            <Button
              variant="default"
              className="py-3 sm:py-4 md:py-5 text-sm sm:text-base md:text-lg rounded-lg md:rounded-xl bg-[#2D4356] hover:bg-[#435B66] shadow-md text-white"
            >
              I want advice from experienced attorneys
            </Button>
          </div>
        </div>
      </div>
    </ScrollAnimation>
  )
}

