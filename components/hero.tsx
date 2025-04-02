"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Phone, Star } from "lucide-react"
import { ScrollAnimation } from "./GlobalScrollAnimation"

export default function Hero() {
  // Custom Trustpilot-style rating display
  // You can update these values manually based on your actual Trustpilot data
  const rating = 4.2 // Your average rating (e.g., 4.8)
  const reviewCount = 6 // Your total number of reviews

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

              {/* Custom Trustpilot-style Rating */}
              <div className="mb-4 sm:mb-6">
                <a
                  href="https://www.trustpilot.com/review/orizeninc.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center"
                >
                  {/* Trustpilot Logo */}
                  <div className="flex items-center mr-2">
                    <svg width="106" height="24" viewBox="0 0 106 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M97.8,14.1V0.3h7.9v2.1h-5.5v3.5h5.1v2.1h-5.1v6.1H97.8z" fill="#191919" />
                      <path d="M88.9,14.1V0.3h2.4v13.8H88.9z" fill="#191919" />
                      <path d="M81.5,14.1V0.3h2.3l4.8,7.8V0.3h2.3v13.8h-2.1l-5-8.1v8.1H81.5z" fill="#191919" />
                      <path d="M70.5,14.1V2.4h-3.7V0.3h9.9v2.1h-3.7v11.7H70.5z" fill="#191919" />
                      <path d="M61.5,14.1V0.3h7.9v2.1h-5.5v3.5H69v2.1h-5.1v4h5.5v2.1H61.5z" fill="#191919" />
                      <path d="M54.2,14.1l-4.1-13.8h2.5l2.9,10.3l3-10.3h2.4l-4.1,13.8H54.2z" fill="#191919" />
                      <path d="M39.8,14.1V0.3h7.9v2.1h-5.5v3.5h5.1v2.1h-5.1v4h5.5v2.1H39.8z" fill="#191919" />
                      <path d="M35.4,14.1V2.4h-3.7V0.3h9.9v2.1h-3.7v11.7H35.4z" fill="#191919" />
                      <path
                        d="M24.7,14.3c-4.1,0-7.3-3.1-7.3-7.2s3.2-7.2,7.3-7.2c2.5,0,4.1,0.7,5.6,2.1l-1.6,1.8c-1.1-1-2.3-1.5-3.9-1.5 c-2.6,0-4.6,2-4.6,4.8c0,2.8,2,4.8,4.6,4.8c1.7,0,2.8-0.5,4-1.6l1.6,1.6C28.9,13.5,27.2,14.3,24.7,14.3z"
                        fill="#191919"
                      />
                      <path d="M12,0.3h-2.3v13.8H12V0.3z" fill="#191919" />
                      <path d="M0,0.3v13.8h7.8v-2.1H2.4V0.3H0z" fill="#191919" />
                      <path
                        d="M12.1,23.7c-6.5,0-11.9-5.3-11.9-11.9h23.7C23.9,18.4,18.6,23.7,12.1,23.7z"
                        fill="#00B67A"
                      />
                      <path d="M12.1,17.1l3.6-0.9l1.5,4.8L12.1,17.1z" fill="#005128" />
                      <polygon points="16.3,9.4 12.1,9.4 10.3,13.8 12.1,17.1 16.3,9.4" fill="white" />
                      <polygon points="16.3,9.4 20.6,9.4 21.9,13.8 16.3,9.4" fill="white" />
                      <polygon points="21.9,13.8 20.6,18.2 17.2,21 21.9,13.8" fill="white" />
                      <polygon points="7.8,9.4 12.1,9.4 10.3,13.8 7.8,9.4" fill="white" />
                      <polygon points="7.8,9.4 3.6,9.4 2.3,13.8 7.8,9.4" fill="white" />
                      <polygon points="2.3,13.8 3.6,18.2 7,21 2.3,13.8" fill="white" />
                    </svg>
                  </div>

                  {/* Rating Stars */}
                  <div className="flex items-center">
                    <div className="flex mr-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-[#00B67A] text-[#00B67A]" fill="#00B67A" />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {rating} | {reviewCount} reviews
                    </span>
                  </div>
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
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 md:top-6 md:left-6 w-16 h-16 sm:w-20 sm:h-20 md:w-32 md:h-32 bg-[#00b67956] rounded-full flex items-center justify-center shadow-lg">
                <Image
                  src="/shape.png"
                  alt="Certified"
                  width={100}
                  height={100}
                  className="rounded-full animate-rotate-slow w-12 h-12 sm:w-16 sm:h-16 md:w-24 md:h-24"
                />
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

