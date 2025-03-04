"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"

export default function Preloader() {
  const [loading, setLoading] = useState(0)
  const [showPreloader, setShowPreloader] = useState(true)
  const [showBlast, setShowBlast] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setLoading((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setShowBlast(true)
          setTimeout(() => {
            setShowPreloader(false)
          }, 2000)
          return 100
        }
        return prev + 1
      })
    }, 30)

    return () => clearInterval(interval)
  }, [])

  // Calculate scale based on loading progress
  const getLogoScale = () => {
    if (loading >= 100) return 1.5
    if (loading >= 50) return 1.25
    return 1
  }

  // Calculate rotation based on loading progress
  const getLogoRotation = () => {
    if (loading >= 100) return 0
    return loading * 3.6
  }

  return (
    <AnimatePresence>
      {showPreloader && (
        <motion.div
          className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          <div className="relative flex flex-col items-center">
            {/* Floating Particles */}
            {[...Array(32)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full bg-[#22c984]"
                initial={{
                  x: i < 8 ? -400 : i < 16 ? 400 : i < 24 ? -400 : 400,
                  y: i < 8 ? -400 : i < 16 ? -400 : i < 24 ? 400 : 400,
                  opacity: 0,
                }}
                animate={
                  showBlast
                    ? {
                        x: Math.cos((i * Math.PI) / 16) * 400,
                        y: Math.sin((i * Math.PI) / 16) * 400,
                        opacity: [1, 0],
                        scale: [1, 0],
                      }
                    : {
                        x: 0,
                        y: 0,
                        opacity: 1,
                        scale: [0.5, 1, 0.5],
                      }
                }
                transition={{
                  duration: showBlast ? 1 : 2,
                  delay: showBlast ? 0 : i * 0.1,
                  repeat: showBlast ? 0 : Number.POSITIVE_INFINITY,
                  ease: showBlast ? "easeOut" : "easeInOut",
                }}
              />
            ))}

            {/* Logo */}
            <motion.div
              className="relative z-10 mb-8"
              animate={{
                scale: getLogoScale(),
                rotate: getLogoRotation(),
              }}
              transition={{
                duration: 0.5,
                ease: "easeInOut",
              }}
            >
              <div className="w-[120px] h-[120px] bg-white rounded-full flex items-center justify-center shadow-lg overflow-hidden">
                <div className="relative w-[80px] h-[80px]">
                  <Image src="/preloader.png" alt="Preloader Logo" fill style={{ objectFit: "contain" }} priority />
                </div>
              </div>
            </motion.div>

            {/* Simple Percentage */}
            <div className="mb-8">
              <span className="text-4xl font-bold text-gray-800">{loading}</span>
              <span className="text-2xl font-bold text-gray-800">%</span>
            </div>

            {/* Loading text */}
            <motion.div
              className="text-xl font-medium font-montserrat tracking-wide uppercase mb-8"
              animate={{
                color: loading === 100 ? "#22c984" : "#666",
              }}
            >
              {loading < 50 ? "Loading..." : loading < 100 ? "Almost there..." : "Ready!"}
            </motion.div>

            {/* Progress bar */}
            <div className="w-72 h-2 bg-gray-100 rounded-full overflow-hidden relative">
              <motion.div
                className="h-full rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: `${loading}%` }}
                transition={{ duration: 0.3 }}
                style={{
                  background: "linear-gradient(90deg, #22c984 0%, #22c984 100%)",
                  boxShadow: "0 0 10px rgba(34,201,132,0.5)",
                }}
              />

              {/* Shine effect */}
              <motion.div
                className="absolute top-0 bottom-0 w-20 bg-white"
                initial={{ left: "-20%", opacity: 0 }}
                animate={{
                  left: ["0%", "100%"],
                  opacity: [0, 0.3, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatDelay: 0.5,
                }}
                style={{
                  filter: "blur(5px)",
                  transform: "skewX(-15deg)",
                }}
              />
            </div>

            {/* Blast wave effect */}
            {showBlast && (
              <motion.div
                className="absolute inset-0"
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [1, 2],
                  opacity: [0.5, 0],
                }}
                transition={{
                  duration: 1,
                  ease: "easeOut",
                }}
                style={{
                  background: "radial-gradient(circle, rgba(34,201,132,0.4) 0%, rgba(255,255,255,0) 70%)",
                }}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

