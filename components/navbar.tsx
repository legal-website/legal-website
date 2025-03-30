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
  LayoutDashboard,
  FileText,
  Users,
  CalendarCheck,
  TicketIcon,
  FileIcon as FileInvoice,
  UserCheck,
  BarChart3,
  ClipboardList,
  Home,
  Menu,
} from "lucide-react"
import { useRouter } from "next/navigation"
import CartDropdown from "./cart-dropdown"
import Image from "next/image"
import { useCart } from "@/context/cart-context"
import { signIn, signOut, useSession } from "next-auth/react"
import { useToast } from "@/components/ui/use-toast"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useDebounce } from "@/hooks/use-debounce"
import { SearchResults } from "./search-results"
import { search } from "@/actions/search"

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

// Add this function to check if user is admin
function isUserAdmin(session: any): boolean {
  return session?.user?.role === "ADMIN" || session?.user?.isAdmin === true
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileUserMenuOpen, setMobileUserMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

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
      setMobileMenuOpen(false) // Close mobile menu after clicking
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

  // Render user avatar/initials
  const renderUserAvatar = () => {
    if (profileImage) {
      return (
        <Image
          src={profileImage || "/placeholder.svg"}
          alt="Profile"
          width={36}
          height={40}
          className="h-9 w-9 rounded-full object-cover"
          unoptimized={profileImage.startsWith("data:")}
        />
      )
    } else {
      return (
        <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-medium">
          {session?.user?.name
            ? session.user.name.charAt(0).toUpperCase()
            : session?.user?.email?.charAt(0).toUpperCase()}
        </div>
      )
    }
  }

  // Get admin menu items with icons
  const getAdminMenuItems = () => [
    { icon: <LayoutDashboard className="h-6 w-6" />, label: "Dashboard", href: "/admin" },
    { icon: <FileInvoice className="h-6 w-6" />, label: "Invoices", href: "/admin/billing/invoices" },
    { icon: <UserCheck className="h-6 w-6" />, label: "Pending Approvals", href: "/admin/users/pending" },
    { icon: <FileText className="h-6 w-6" />, label: "Client Documents", href: "/admin/documents/client" },
    { icon: <Users className="h-6 w-6" />, label: "All Users", href: "/admin/users/all" },
    { icon: <BarChart3 className="h-6 w-6" />, label: "Orizen Analytics", href: "/admin/orizen-analytics" },
    { icon: <TicketIcon className="h-6 w-6" />, label: "Tickets", href: "/admin/tickets" },
    { icon: <ClipboardList className="h-6 w-6" />, label: "Amendments", href: "/admin/compliance/amendments" },
  ]

  // Get client menu items with icons
  const getClientMenuItems = () => [
    { icon: <LayoutDashboard className="h-6 w-6" />, label: "Dashboard", href: "/dashboard" },
    { icon: <User className="h-6 w-6" />, label: "Profile", href: "/dashboard/business/profile" },
    { icon: <TicketIcon className="h-6 w-6" />, label: "My Tickets", href: "/dashboard/tickets" },
    { icon: <Users className="h-6 w-6" />, label: "Community", href: "/dashboard/community" },
    { icon: <FileText className="h-6 w-6" />, label: "My Documents", href: "/dashboard/documents/business" },
    {
      icon: <CalendarCheck className="h-6 w-6" />,
      label: "Annual Reports",
      href: "/dashboard/compliance/annual-reports",
    },
  ]

  // Render menu items based on user role
  const renderMenuItems = () => {
    if (isUserAdmin(session)) {
      return (
        <>
          <Link
            href="/admin"
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
            onClick={() => setUserMenuOpen(false)}
          >
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Dashboard
          </Link>
          <Link
            href="/admin/billing/invoices"
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
            onClick={() => setUserMenuOpen(false)}
          >
            <FileInvoice className="h-4 w-4 mr-2" />
            Invoices
          </Link>
          <Link
            href="/admin/users/pending"
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
            onClick={() => setUserMenuOpen(false)}
          >
            <UserCheck className="h-4 w-4 mr-2" />
            Pending Approvals
          </Link>
          <Link
            href="/admin/documents/client"
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
            onClick={() => setUserMenuOpen(false)}
          >
            <FileText className="h-4 w-4 mr-2" />
            Client Documents
          </Link>
          <Link
            href="/admin/users/all"
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
            onClick={() => setUserMenuOpen(false)}
          >
            <Users className="h-4 w-4 mr-2" />
            All Users
          </Link>
          <Link
            href="/admin/orizen-analytics"
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
            onClick={() => setUserMenuOpen(false)}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Orizen Analytics
          </Link>
          <Link
            href="/admin/tickets"
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
            onClick={() => setUserMenuOpen(false)}
          >
            <TicketIcon className="h-4 w-4 mr-2" />
            Tickets
          </Link>
          <Link
            href="/admin/compliance/amendments"
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
            onClick={() => setUserMenuOpen(false)}
          >
            <ClipboardList className="h-4 w-4 mr-2" />
            Amendments
          </Link>
        </>
      )
    } else {
      return (
        <>
          <Link
            href="/dashboard"
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
            onClick={() => setUserMenuOpen(false)}
          >
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Dashboard
          </Link>
          <Link
            href="/dashboard/business/profile"
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
            onClick={() => setUserMenuOpen(false)}
          >
            <User className="h-4 w-4 mr-2" />
            Profile
          </Link>
          <Link
            href="/dashboard/tickets"
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
            onClick={() => setUserMenuOpen(false)}
          >
            <TicketIcon className="h-4 w-4 mr-2" />
            My Tickets
          </Link>
          <Link
            href="/dashboard/community"
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
            onClick={() => setUserMenuOpen(false)}
          >
            <Users className="h-4 w-4 mr-2" />
            Community
          </Link>
          <Link
            href="/dashboard/documents/business"
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
            onClick={() => setUserMenuOpen(false)}
          >
            <FileText className="h-4 w-4 mr-2" />
            My Documents
          </Link>
          <Link
            href="/dashboard/compliance/annual-reports"
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
            onClick={() => setUserMenuOpen(false)}
          >
            <CalendarCheck className="h-4 w-4 mr-2" />
            Annual Reports
          </Link>
        </>
      )
    }
  }

  // Live Search
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedSearchQuery) {
        setSearchResults([])
        setIsSearching(false)
        return
      }

      setIsSearching(true)
      try {
        const results = await search({ query: debouncedSearchQuery })
        setSearchResults(results)
      } catch (error) {
        console.error("Search error:", error)
        toast({
          title: "Error",
          description: "Failed to perform search. Please try again.",
          variant: "destructive",
        })
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }

    performSearch()
  }, [debouncedSearchQuery, toast])

  return (
    <>
      {/* Desktop Navigation */}
      <nav
        className={`bg-[#f9f6f2] px-6 border-b sticky top-0 z-50 transition-shadow duration-300 ${
          hasScrolled ? "shadow-md" : "shadow-none"
        } hidden md:block`}
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
                    className="rounded-full overflow-hidden p-0"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                  >
                    {renderUserAvatar()}
                    <span className="sr-only">My Account</span>
                  </Button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      <div className="px-4 py-2 text-sm text-gray-700 border-b">
                        <p className="font-medium">{session?.user?.name || session?.user?.email}</p>
                        <p className="text-xs text-gray-500">{session?.user?.email}</p>
                      </div>

                      {renderMenuItems()}

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
      </nav>

      {/* Mobile Navigation */}
      <nav
        className={`bg-[#f9f6f2] px-4 border-b sticky top-0 z-50 transition-shadow duration-300 ${
          hasScrolled ? "shadow-md" : "shadow-none"
        } md:hidden`}
      >
        <div className="flex items-center justify-between h-16">
          {/* Hamburger Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="p-1">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[250px] sm:w-[300px]">
              <div className="py-4">
                <Link href="/" className="flex justify-center mb-6">
                  <Image src="/logo.png" alt="Orizen Inc Logo" height={50} width={160} priority quality={100} />
                </Link>
                <div className="flex flex-col space-y-4">
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
                      focus:text-[#22c984] transition duration-300 ease-in-out py-2 px-4 rounded-md
                      font-[Montserrat] text-[15px] font-[400]"
                    >
                      <span>{item.title}</span>
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      router.push("/contact")
                      setMobileMenuOpen(false)
                    }}
                    className="flex items-center space-x-2 text-black hover:text-[#22c984] 
                    focus:text-[#22c984] transition duration-300 ease-in-out py-2 px-4 rounded-md
                    font-[Montserrat] text-[15px] font-[400]"
                  >
                    Contact Us
                  </button>
                  <button
                    onClick={() => {
                      router.push("/about")
                      setMobileMenuOpen(false)
                    }}
                    className="flex items-center space-x-2 text-black hover:text-[#22c984] 
                    focus:text-[#22c984] transition duration-300 ease-in-out py-2 px-4 rounded-md
                    font-[Montserrat] text-[15px] font-[400]"
                  >
                    About Us
                  </button>

                  {status === "authenticated" && (
                    <button
                      onClick={() => {
                        handleSignOut()
                        setMobileMenuOpen(false)
                      }}
                      className="flex items-center space-x-2 text-black hover:text-[#22c984] 
                      focus:text-[#22c984] transition duration-300 ease-in-out py-2 px-4 rounded-md
                      font-[Montserrat] text-[15px] font-[400] mt-4"
                    >
                      <LogOut className="h-5 w-5 mr-2" />
                      <span>Logout</span>
                    </button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link href="/" className="flex-shrink-0 mx-auto">
            <Image src="/logo.png" alt="Orizen Inc Logo" height={40} width={130} priority quality={100} />
          </Link>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t z-50 md:hidden">
        <div className="flex justify-between items-center h-16 px-6">
          {/* Home Button */}
          <Link href="/" className="flex flex-col items-center justify-center text-gray-600 hover:text-[#22c984]">
            <Home className="h-6 w-6" />
            <span className="text-xs mt-1">Home</span>
          </Link>

          {/* Center: User Profile or Login */}
          {status === "authenticated" ? (
            <div className="relative">
              <button
                onClick={() => setMobileUserMenuOpen(!mobileUserMenuOpen)}
                className="flex flex-col items-center justify-center"
              >
                <div className="h-10 w-10 rounded-full overflow-hidden">{renderUserAvatar()}</div>
                <span className="text-xs mt-1">Account</span>
              </button>

              {/* Mobile User Menu - Icons with Tooltips */}
              {mobileUserMenuOpen && (
                <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl p-4 w-[280px]">
                  <div className="grid grid-cols-4 gap-4">
                    <TooltipProvider>
                      {(isUserAdmin(session) ? getAdminMenuItems() : getClientMenuItems()).map((item, index) => (
                        <Tooltip key={index}>
                          <TooltipTrigger asChild>
                            <Link
                              href={item.href}
                              className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-100"
                              onClick={() => setMobileUserMenuOpen(false)}
                            >
                              <div className="text-gray-700">{item.icon}</div>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{item.label}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => {
                              handleSignOut()
                              setMobileUserMenuOpen(false)
                            }}
                            className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-100"
                          >
                            <LogOut className="h-6 w-6 text-gray-700" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Logout</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setSignInOpen(true)}
              className="flex flex-col items-center justify-center text-gray-600 hover:text-[#22c984]"
            >
              <User className="h-6 w-6" />
              <span className="text-xs mt-1">Sign In</span>
            </button>
          )}

          {/* Cart Button */}
          <div className="relative">
            <button
              className="flex flex-col items-center justify-center text-gray-600 hover:text-[#22c984]"
              onClick={() => setCartOpen(!cartOpen)}
            >
              <ShoppingCart className="h-6 w-6" />
              <span className="text-xs mt-1">Cart</span>
              {itemCount > 0 && (
                <span className="absolute -top-1 right-0 bg-[#22c984] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>

            {cartOpen && (
              <div className="absolute bottom-16 right-0 w-[280px] bg-white rounded-lg shadow-xl max-h-[80vh] overflow-auto">
                <CartDropdown />
              </div>
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
              className="bg-white p-8 rounded-2xl w-full max-w-lg mx-4 z-[1001]"
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
                className="w-full p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22c984]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {debouncedSearchQuery && (
                <SearchResults results={searchResults} isLoading={isSearching} onClose={() => setSearchOpen(false)} />
              )}
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
              className="bg-white p-5 rounded-lg shadow-2xl w-[90%] max-w-[780px] flex flex-col md:flex-row border-[5px] border-white"
            >
              {/* Green section - only visible on desktop */}
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
                        className="form-checkbox h-5 w-5 text-[#22c984]"
                      />
                      <span className="text-sm">
                        I agree to the{" "}
                        <a href="/privacy-policy" className="text-[#22c984] underline">
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
                  <a href="/sign-up" className="text-[#22c984] underline">
                    Sign up instead
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

