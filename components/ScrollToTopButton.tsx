"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { ArrowUp, ArrowDown } from "lucide-react"

export default function ScrollButton() {
  const [isVisible, setIsVisible] = useState(false)
  const [isScrollingUp, setIsScrollingUp] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      // Show button when scrolled past 300px
      if (window.scrollY > 300) {
        setIsVisible(true)

        // Determine scroll direction
        if (window.scrollY < lastScrollY) {
          setIsScrollingUp(true) // Scrolling up - show "scroll to top"
        } else {
          setIsScrollingUp(false) // Scrolling down - show "scroll to bottom"
        }
      } else {
        setIsVisible(false)
      }

      setLastScrollY(window.scrollY)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [lastScrollY])

  const handleClick = () => {
    if (isScrollingUp) {
      // Scroll to top
      window.scrollTo({ top: 0, behavior: "smooth" })
    } else {
      // Scroll to bottom
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "smooth",
      })
    }
  }

  return (
    <div className="fixed bottom-20 sm:bottom-10 right-4 sm:right-6 flex items-center justify-center z-40">
      {isVisible && (
        <div className="relative flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28">
          <motion.div
            className="absolute w-full h-full flex items-center justify-center"
            animate={{ rotate: 360 }}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 6, ease: "linear" }}
          >
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <defs>
                <path id="circlePath" d="M 50,50 m -35,0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0" fill="transparent" />
              </defs>
              <text className="text-[7px] sm:text-[8px] md:text-[9px] uppercase font-semibold fill-[#22c984] tracking-wide">
                <textPath href="#circlePath" startOffset="0%">
                  {isScrollingUp
                    ? "Click • For • Smooth • Scroll • To • Top •"
                    : "Click • For • Smooth • Scroll • Bottom •"}
                </textPath>
              </text>
            </svg>
          </motion.div>

          <motion.button
            onClick={handleClick}
            className="absolute w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-[#22c984] text-white rounded-full flex items-center justify-center shadow-lg"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isScrollingUp ? (
              <ArrowUp size={18} className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
            ) : (
              <ArrowDown size={18} className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
            )}
          </motion.button>
        </div>
      )}
    </div>
  )
}

