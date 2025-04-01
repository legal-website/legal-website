"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Play, X } from "lucide-react"
import { motion } from "framer-motion"
import { useMediaQuery } from "@/hooks/use-mobile"

export default function InfoVideoSection() {
  const [isOpen, setIsOpen] = useState(false)
  const [animate, setAnimate] = useState(false)
  const isMobile = useMediaQuery("(max-width: 768px)")

  useEffect(() => {
    const handleScroll = () => {
      const section = document.getElementById("info-video-section")
      if (section) {
        const sectionTop = section.getBoundingClientRect().top
        const windowHeight = window.innerHeight
        if (sectionTop < windowHeight - 100) {
          setAnimate(true)
        }
      }
    }

    window.addEventListener("scroll", handleScroll)
    // Trigger once on mount to check if already in view
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const fadeInVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 1.5, ease: "easeInOut" } },
  }

  const slideFromLeft = {
    hidden: { opacity: 0, x: -100 },
    visible: { opacity: 1, x: 0, transition: { duration: 1.5, ease: "easeInOut" } },
  }

  const slideFromRight = {
    hidden: { opacity: 0, x: 100 },
    visible: { opacity: 1, x: 0, transition: { duration: 1.5, ease: "easeInOut" } },
  }

  const handleVideoClick = () => {
    if (isMobile) {
      // Open YouTube video in a new tab on mobile
      window.open("https://www.youtube.com/watch?v=dWT6P2asa8Y", "_blank")
    } else {
      // Open modal on desktop
      setIsOpen(true)
    }
  }

  return (
    <section
      id="info-video-section"
      className="py-8 sm:py-12 md:py-16 bg-white px-4 sm:px-6 md:px-8 lg:px-[13%] overflow-x-hidden"
    >
      <div className="max-w-7xl mx-auto overflow-hidden">
        <motion.h2
          initial="hidden"
          animate={animate ? "visible" : "hidden"}
          variants={fadeInVariants}
          className="text-2xl sm:text-3xl md:text-[40px] font-medium font-['Montserrat'] text-center mb-6 sm:mb-10"
        >
          What you should know about
          <br className="hidden sm:block" />
          Starting an LLC
        </motion.h2>

        <div className="bg-white p-4 sm:p-6 md:p-10 rounded-xl sm:rounded-2xl md:rounded-3xl shadow-[0px_2px_5px_rgba(0,0,0,0.1)] border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">
            <motion.div
              initial="hidden"
              animate={animate ? "visible" : "hidden"}
              variants={slideFromLeft}
              className="order-2 md:order-1"
            >
              <p className="text-gray-700 text-sm sm:text-base md:text-[17px] font-['Nethead'] mb-3 sm:mb-4 break-words">
                To form an LLC you&apos;ll need to file articles of organization with the state.
                <span className="underline decoration-[#22c984]">
                  Each state has its own rules, but our experience across all states helps us keep things moving
                </span>
                when we file on your behalf.
              </p>
              <p className="text-gray-600 text-xs sm:text-sm md:text-base">
                Here are a few things you&apos;ll need to keep in mind to get your LLC up and running.
              </p>
            </motion.div>
            <motion.div
              initial="hidden"
              animate={animate ? "visible" : "hidden"}
              variants={slideFromRight}
              className="relative order-1 md:order-2"
            >
              <div
                className="aspect-[16/9] relative rounded-md overflow-hidden cursor-pointer w-full sm:w-4/5 md:w-3/4 mx-auto"
                onClick={handleVideoClick}
                role="button"
                aria-label="Play video about starting an LLC"
              >
                <Image src="/video.webp" alt="Video thumbnail" fill className="object-cover" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-black bg-opacity-75 rounded-full flex items-center justify-center">
                    <Play className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {isOpen && !isMobile && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50 p-4 overflow-y-auto overflow-x-hidden">
          <div className="bg-transparent rounded-2xl max-w-2xl w-full md:w-4/5 lg:w-3/4 relative mx-auto">
            <button
              className="absolute -top-10 right-0 text-white hover:text-gray-300 z-10"
              onClick={() => setIsOpen(false)}
              aria-label="Close video"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="relative aspect-video w-full">
              <iframe
                className="w-full h-full rounded-xl"
                src="https://www.youtube.com/embed/dWT6P2asa8Y?autoplay=1"
                title="YouTube video about starting an LLC"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

