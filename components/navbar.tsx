"use client"

import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { Search, ChevronDown, Phone, X, Eye, EyeOff } from "lucide-react"
import { useRouter } from 'next/navigation';
import Image from "next/image"

export default function Navbar() {
  const [isClicked, setIsClicked] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [signInOpen, setSignInOpen] = useState(false)
  const [hasScrolled, setHasScrolled] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [privacyChecked, setPrivacyChecked] = useState(false)
  const modalRef = useRef<HTMLDivElement | null>(null)
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const smoothScroll = (targetPosition: number, duration: number) => {
    const startPosition = window.pageYOffset
    const distance = targetPosition - startPosition
    let startTime: number | null = null

    function animation(currentTime: number) {
      if (startTime === null) startTime = currentTime
      const timeElapsed = currentTime - startTime
      const run = ease(timeElapsed, startPosition, distance, duration)
      window.scrollTo(0, run)
      if (timeElapsed < duration) requestAnimationFrame(animation)
    }

    function ease(t: number, b: number, c: number, d: number) {
      t /= d / 2
      if (t < 1) return (c / 2) * t * t + b
      t--
      return (-c / 2) * (t * (t - 2) - 1) + b
    }

    requestAnimationFrame(animation)
  }

  const scrollToSection = (id: string) => {
    const section = document.getElementById(id)
    if (section) {
      const navbarHeight = document.querySelector("nav")?.offsetHeight || 0
      const targetPosition = section.getBoundingClientRect().top + window.pageYOffset - navbarHeight - 20
      smoothScroll(targetPosition, 1000)
    }
  }

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const searchContainer = document.getElementById("search-container")
      if (searchOpen && searchContainer && !searchContainer.contains(event.target as Node)) {
        setSearchOpen(false)
      }
    }

    if (searchOpen) {
      document.addEventListener("click", handleOutsideClick)
    }
    return () => document.removeEventListener("click", handleOutsideClick)
  }, [searchOpen])

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8, y: -50 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: -50,
      transition: {
        duration: 0.2,
      },
    },
  }

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  }

  return (
    <nav
      className={`bg-[#f9f6f2] border-b sticky top-0 z-50 transition-shadow duration-300 ${hasScrolled ? "shadow-md" : "shadow-none"}`}
    >
      <div className="container mx-auto px-20">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
          <Link href="/" className="flex items-center">
  <Image 
    src="/logo.png" 
    alt="Orizen Inc Logo" 
    height={100} 
    width={200} 
    priority 
    quality={100} // Ensures high-quality rendering
  />
</Link>

<div className="hidden md:flex ml-20 space-x-12">
      {[
        { title: "Pricing", id: "pricing-section" },
        { title: "Why Choose Us", id: "whyuse" },
        { title: "How To Start", id: "how" },
        { title: "FAQs", id: "faqs" },
        { title: "States", id: "states" },
      ].map((item) => (
        <button
          key={item.id}
          onClick={() => scrollToSection(item.id)}
          className="flex items-center space-x-2 text-black hover:text-[#22c984] 
          focus:text-[#22c984] transition duration-500 ease-in-out transform hover:scale-105 
          font-[Montserrat] text-[16px] font-[400]"
        >
          <span>{item.title}</span>
          <ChevronDown className="h-4 w-4" />
        </button>
      ))}
{
  
  <button
    onClick={() => router.push('/contact')}
    className="flex items-center space-x-2 text-black hover:text-[#22c984] 
    focus:text-[#22c984] transition duration-500 ease-in-out transform hover:scale-105 
    font-[Montserrat] text-[16px] font-[400]"
  >
    <span>Data</span>
  </button>
}
    </div>
</div>
          <div className="flex items-center space-x-10">
            <div className="hidden md:flex items-center">
              <Phone
                className={`h-4 w-4 mr-2 transition-colors duration-300 ${isClicked ? "text-black" : "text-gray-500"}`}
              />
              <a
                href="tel:8557871221"
                className={`font-medium transition-colors duration-300 ${isClicked ? "text-[#22c984]" : "text-black"}`}
                onClick={() => setIsClicked(true)}
              >
                (855) 787-1221
              </a>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="rounded-full border border-black"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Button>

            <Button className="bg-black text-white rounded-full px-6" onClick={() => setSignInOpen(true)}>
              Sign in
            </Button>
          </div>
        </div>
      </div>

      {/* Search Modal */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={backdropVariants}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              id="search-container"
              className="bg-white p-8 rounded-2xl w-full max-w-lg z-[1001]"
              onClick={(e) => e.stopPropagation()}
              variants={modalVariants}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Search</h2>
                <Button variant="ghost" size="icon" onClick={() => setSearchOpen(false)}>
                  <X className="h-6 w-6" />
                </Button>
              </div>
              <input
                type="text"
                placeholder="Type to search..."
                className="w-full p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22c984] "
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sign In Modal */}
      <AnimatePresence>
        {signInOpen && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={backdropVariants}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]"
          >
            <motion.div
              ref={modalRef}
              variants={modalVariants}
              className="bg-white p-5 rounded-lg shadow-2xl w-[780px] flex border-[5px] border-white"
            >
              <div className="w-1/2 hidden md:flex bg-[#22c984] rounded-l-lg items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                >
                  <Image
                    src="/login.webp"
                    alt="Sign In Illustration"
                    width={900}
                    height={600}
                    className="object-cover"
                  />
                </motion.div>
              </div>
              <div className="w-full md:w-1/2 p-6 relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4"
                  onClick={() => setSignInOpen(false)}
                >
                  <X className="h-6 w-6" />
                </Button>
                <div className="absolute top-4 left-4">
                  <Image src="/logo.png" alt="Orizen Logo" width={270} height={110} className="object-cover" />
                </div>
                <div className="mt-20 flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Sign In</h2>
                </div>
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full p-4 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1eac73] hover:shadow-lg"
                  pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
                  required
                />
                <div className="relative mb-4">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    className="w-full p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1eac73] hover:shadow-lg"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-500" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                </div>
                <div className="mb-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={privacyChecked}
                      onChange={() => setPrivacyChecked(!privacyChecked)}
                      className="form-checkbox h-5 w-5 text-[#22c984] "
                    />
                    <span className="text-sm">
                      I agree to the{" "}
                      <a href="/privacy-policy" className="text-[#22c984]  underline">
                        Privacy Policy
                      </a>
                    </span>
                  </label>
                </div>
                <Button
                  className="w-full bg-black text-white py-4 rounded-lg hover:[#1eac73]"
                  disabled={!privacyChecked}
                >
                  Sign In
                </Button>
                <div className="text-center mt-4 text-sm">
                  Don&apos;t have an account?{" "}
                  <a href="/sign-up" className="text-[#22c984]  underline">
                    Sign up instead
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

