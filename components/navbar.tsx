"use client"
import Link from "next/link"
import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  ChevronDown,
  X,
  Eye,
  EyeOff,
  ShoppingCart,
  User,
  LogOut,
  Settings,
  LayoutDashboard,
} from "lucide-react"
import { useRouter } from "next/navigation"
import CartDropdown from "./cart-dropdown"
import Image from "next/image"
import { useCart } from "@/context/cart-context"
import { signIn, signOut, useSession } from "next-auth/react"
import { useToast } from "@/components/ui/use-toast"

// Add a function to fetch the latest user data
async function fetchUserProfile() {
  try {
    const response = await fetch("/api/user/profile")

    if (!response.ok) {
      throw new Error("Failed to fetch user profile")
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return null
  }
}

export default function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [signInOpen, setSignInOpen] = useState(false)
  const [hasScrolled] = useState(false)
  const { getItemCount } = useCart() // Updated to use getItemCount function
  const itemCount = getItemCount() // Get the actual count
  const [cartOpen, setCartOpen] = useState(false)
  const cartRef = useRef<HTMLDivElement>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [privacyChecked, setPrivacyChecked] = useState(false)
  const modalRef = useRef<HTMLDivElement | null>(null)
  const router = useRouter()
  const { data: session, status } = useSession()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [timestamp, setTimestamp] = useState(Date.now()) // For cache busting

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (cartRef.current && !cartRef.current.contains(event.target as Node)) {
        setCartOpen(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
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

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        console.error("Login error:", result.error)

        // Show appropriate error message
        if (result.error === "CredentialsSignin") {
          toast({
            title: "Login failed",
            description: "Invalid email or password. Please try again.",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Login failed",
            description: result.error,
            variant: "destructive",
          })
        }
      } else {
        // Successful login
        setSignInOpen(false)
        toast({
          title: "Success",
          description: "You have successfully logged in.",
        })
      }
    } catch (err) {
      console.error("Unexpected login error:", err)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false })
      router.push("/")
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      })
    } catch (error) {
      console.error("Sign out error:", error)
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Fetch the user profile when the component mounts
  useEffect(() => {
    const getProfileImage = async () => {
      if (status === "authenticated") {
        try {
          const userData = await fetchUserProfile()
          if (userData && userData.image) {
            // Add timestamp to prevent caching
            setProfileImage(`${userData.image}?t=${Date.now()}`)
          }
        } catch (error) {
          console.error("Error fetching profile image:", error)
        }
      }
    }

    getProfileImage()
  }, [status])

  return (
    <nav
      className={`bg-[#f9f6f2] px-6 border-b sticky top-0 z-50 transition-shadow duration-300 ${hasScrolled ? "shadow-md" : "shadow-none"}`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex-shrink-0">
            <Image src="/logo.png" alt="Orizen Inc Logo" height={70} width={230} priority quality={100} />
          </Link>
          <div className="hidden md:flex space-x-8 flex-1 justify-center">
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
                className="flex items-center space-x-1 text-black hover:text-[#22c984] 
                focus:text-[#22c984] transition duration-500 ease-in-out transform hover:scale-105 
                font-[Montserrat] text-[15px] font-[400]"
              >
                <span>{item.title}</span>
                <ChevronDown className="h-4 w-4" />
              </button>
            ))}
            <button
              onClick={() => router.push("/contact")}
              className="text-black hover:text-[#22c984] focus:text-[#22c984] 
              transition duration-500 ease-in-out transform hover:scale-105 
              font-[Montserrat] text-[15px] font-[400]"
            >
              Contact Us
            </button>
            <button
              onClick={() => router.push("/about")}
              className="text-black hover:text-[#22c984] focus:text-[#22c984] 
              transition duration-500 ease-in-out transform hover:scale-105 
              font-[Montserrat] text-[15px] font-[400]"
            >
              About Us
            </button>
          </div>
          <div className="flex items-center space-x-10">
            <div className="relative" ref={cartRef}>
              <button
                className="relative p-2 text-gray-600 hover:text-[#22c984] transition-colors"
                onClick={() => setCartOpen(!cartOpen)}
                onMouseEnter={() => setCartOpen(true)}
              >
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#22c984] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </button>
              {cartOpen && <CartDropdown />}
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

            {status === "authenticated" ? (
              <div className="relative" ref={userMenuRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full border border-black overflow-hidden"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  {profileImage ? (
                    <Image
                      src={profileImage || "/placeholder.svg"}
                      alt="Profile"
                      width={24}
                      height={24}
                      className="h-5 w-5 rounded-full object-cover"
                      unoptimized={profileImage.startsWith("data:")}
                    />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                  <span className="sr-only">My Account</span>
                </Button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b">
                      <p className="font-medium">{session?.user?.name || session?.user?.email}</p>
                      <p className="text-xs text-gray-500">{session?.user?.email}</p>
                    </div>
                    <Link
                      href="/dashboard"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                    >
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Dashboard
                    </Link>
                    <Link
                      href="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Button className="bg-black text-white rounded-full px-6" onClick={() => setSignInOpen(true)}>
                Sign in
              </Button>
            )}
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
                <form onSubmit={handleSignIn}>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-4 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1eac73] hover:shadow-lg"
                    pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
                    required
                  />
                  <div className="relative mb-4">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1eac73] hover:shadow-lg"
                      required
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
                    type="submit"
                    className="w-full bg-black text-white py-4 rounded-lg hover:[#1eac73]"
                    disabled={!privacyChecked || isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
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

