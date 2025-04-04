"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Play, X } from "lucide-react"
import { motion } from "framer-motion"

export default function InfoVideoSection() {
  const [isOpen, setIsOpen] = useState(false)
  const [animate, setAnimate] = useState(false)

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

  return (
    <section id="info-video-section" className="py-0 bg-white px-4 sm:px-6 md:px-8 lg:px-12">
      <div className="max-w-7xl mx-auto">
        <motion.h2
          initial="hidden"
          animate={animate ? "visible" : "hidden"}
          variants={fadeInVariants}
          className="text-2xl md:text-3xl lg:text-[40px] font-medium font-['Montserrat'] text-center mb-6 md:mb-10"
        >
          What you should know about
          <br />
          Starting an LLC
        </motion.h2>

        <div className="bg-white p-4 sm:p-6 md:p-10 rounded-xl md:rounded-3xl shadow-[0px_2px_5px_rgba(0,0,0,0.1)] border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 items-center">
            <motion.div initial="hidden" animate={animate ? "visible" : "hidden"} variants={slideFromLeft}>
              <p className="text-gray-700 text-base md:text-[17px] font-['Nethead'] mb-4">
                To form an LLC you&apos;ll need to file articles of organization with the state.
                <span className="underline decoration-[#22c984]">
                  Each state has its own rules, but our experience across all states helps us keep things moving
                </span>
                when we file on your behalf.
              </p>
              <p className="text-gray-600">
                Here are a few things you&apos;ll need to keep in mind to get your LLC up and running.
              </p>
            </motion.div>
            <motion.div
              initial="hidden"
              animate={animate ? "visible" : "hidden"}
              variants={slideFromRight}
              className="relative"
            >
              <div
                className="aspect-[16/9] relative rounded-md overflow-hidden cursor-pointer w-full sm:w-5/6 md:w-3/4 mx-auto"
                onClick={() => setIsOpen(true)}
              >
                <Image src="/video.webp" alt="Video thumbnail" fill className="object-cover" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-black bg-opacity-75 rounded-full flex items-center justify-center">
                    <Play className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50 p-4">
          <div className="bg-transparent p-2 sm:p-4 md:p-6 rounded-xl md:rounded-2xl max-w-2xl w-full relative shadow-none border-none">
            {/* Improved close button for better visibility on mobile */}
            <button
              className="absolute -top-10 right-0 z-50 bg-white rounded-full p-2 shadow-lg"
              onClick={() => setIsOpen(false)}
              aria-label="Close video"
            >
              <X className="w-6 h-6 text-black" />
            </button>
            <div className="relative aspect-video">
              <iframe
                className="w-full h-full rounded-2xl"
                src="https://www.youtube.com/embed/tVaZ_BpV1vc"
                title="YouTube video"
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

