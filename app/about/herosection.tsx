"use client"
import Link from "next/link"
import { useState } from "react"
import VideoModal from "@/components/video-modal"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function AboutUs() {
  const router = useRouter()
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)

  return (
    <main className="min-h-screen overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-950 to-[#22c984] overflow-hidden">
        <div className="absolute bottom-0 left-0 w-1/3 h-24 bg-[#22c9836b] rounded-tr-[100px]"></div>
        <div className="container mx-auto px-4 sm:px-6 md:px-8 py-16 sm:py-20 md:py-24 lg:py-28 flex flex-col items-center justify-center text-center relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">About Us</h1>
            <div className="inline-flex items-center bg-black/20 px-4 py-2 rounded-md">
              <Link href="/" className="text-white hover:text-blue-200 transition">
                Home
              </Link>
              <span className="mx-2 text-white">&gt;</span>
              <span className="text-white">About</span>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 opacity-30">
          <Image src="/expo.webp" alt="Technology background" fill className="object-cover" priority />
        </div>
      </section>

      {/* Content Section with Triangle Pattern Background */}
      <section className="py-10 sm:py-12 md:py-16 relative overflow-hidden">
        {/* Triangle Pattern Background */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="w-full h-full"
            style={{
              backgroundImage:
                "linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)",
              backgroundSize: "40px 40px",
              backgroundPosition: "0 0, 0 20px, 20px -20px, -20px 0px",
            }}
          ></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 md:px-8 relative z-10">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Left Column - Image and Video */}
            <div className="relative mx-auto md:ml-4 max-w-md md:max-w-full">
              <div className="relative w-full aspect-[4/3] md:aspect-auto">
                <Image
                  src="/abouts.png"
                  alt="Business professionals working together"
                  width={515}
                  height={500}
                  className="object-contain w-full h-auto"
                />

                <div
                  className="absolute bottom-4 right-4 sm:bottom-10 sm:right-6 w-[180px] sm:w-[220px] md:w-[250px] h-[100px] sm:h-[120px] md:h-40 rounded-md bg-[#22c984] flex items-center justify-center cursor-pointer hover:bg-[#166948] transition"
                  onClick={() => setIsVideoModalOpen(true)}
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center bg-white rounded-full">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-10 text-[#22c984]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Text Content */}
            <div>
              <div className="mb-4 sm:mb-6">
                <span className="text-[#22c984] font-medium text-sm sm:text-base">Empower Your LLC With Reliable</span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mt-2">
                  About Our 291+ Successful LLC Formations and Business Solutions.
                </h2>
              </div>

              <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base">
                We provide tailored market solutions and innovative strategies, helping LLCs visualize growth through
                cutting-edge infrastructure and efficient task management models.
              </p>

              <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#22c984] hover:bg-[#166948] flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 sm:h-4 sm:w-4 text-white"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">LLC Management Solutions</h3>
                    <p className="text-gray-600 text-xs sm:text-sm">
                      Providing tailored market solutions with a dedicated team and streamlined business models for LLC
                      success.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#22c984] hover:bg-[#166948] flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 sm:h-4 sm:w-4 text-white"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">LLC Formation Services</h3>
                    <p className="text-gray-600 text-xs sm:text-sm">
                      Providing specialized market solutions with a dedicated team and efficient business models for LLC
                      growth.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 sm:pt-6">
                <button
                  className="inline-flex items-center justify-center w-full sm:w-auto px-6 sm:px-8 md:px-12 lg:px-16 py-3 bg-[#22c984] text-black rounded-md hover:bg-[#166a47] hover:text-white transition-colors group"
                  onClick={() => router.push("/contact")}
                >
                  Contact Us
                  <svg
                    className="ml-2 w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-1"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Modal */}
      <VideoModal
        videoId="tVaZ_BpV1vc" // Replace with your actual YouTube video ID
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
      />
    </main>
  )
}

