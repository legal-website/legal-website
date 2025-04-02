"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import {
  Home,
  FileText,
  Building,
  Users,
  Settings,
  LogOut,
  ChevronDown,
  File,
  Upload,
  MessageCircle,
  TicketIcon,
  Tag,
  CreditCard,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/context/theme-context"
import { signOut, useSession } from "next-auth/react"
import { toast } from "@/components/ui/use-toast"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { useMobile } from "@/hooks/use-mobile"
import { useSidebar } from "@/context/sidebar-context"

// Add a new function to handle profile image upload
async function uploadProfileImage(file: File, userId: string) {
  try {
    console.log(`Uploading profile image for user ${userId}`)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("userId", userId)

    const response = await fetch("/api/user/profile-image", {
      method: "POST",
      body: formData,
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("Upload failed with status:", response.status, data)
      throw new Error(data.error || "Failed to upload image")
    }

    console.log("Upload successful:", data)
    return data.imageUrl
  } catch (error) {
    console.error("Error uploading profile image:", error)
    throw error
  }
}

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

interface MenuItem {
  icon: React.ElementType
  label: string
  href: string
  subItems?: { label: string; href: string }[]
}

// Add a new prop for user data
interface DashboardSidebarProps {
  userData?: {
    id: string
    name?: string | null
    image?: string | null
    businessName?: string | null
  }
}

const menuItems: MenuItem[] = [
  {
    icon: Home,
    label: "Dashboard",
    href: "/dashboard",
  },
  {
    icon: Building,
    label: "Business Information",
    href: "/dashboard/business",
    subItems: [
      { label: "Business Profile", href: "/dashboard/business/profile" },
      { label: "Order History", href: "/dashboard/business/orders" },
    ],
  },
  {
    icon: FileText,
    label: "Compliance",
    href: "/dashboard/compliance",
    subItems: [
      { label: "Amendments", href: "/dashboard/compliance/amendments" },
      { label: "Annual Reports", href: "/dashboard/compliance/annual-reports" },
      { label: "Beneficial Ownership", href: "/dashboard/compliance/beneficial-ownership" },
    ],
  },
  {
    icon: File,
    label: "Documents",
    href: "/dashboard/documents",
    subItems: [
      { label: "Business Documents", href: "/dashboard/documents/business" },
      { label: "Document Templates", href: "/dashboard/documents/templates" },
    ],
  },
  {
    icon: TicketIcon,
    label: "Support Tickets",
    href: "/dashboard/tickets",
  },
  {
    icon: MessageCircle,
    label: "Community",
    href: "/dashboard/community",
  },
  {
    icon: Users,
    label: "Affiliate Program",
    href: "/dashboard/affiliate",
  },
  {
    icon: Tag,
    label: "Coupons",
    href: "/dashboard/coupons",
  },
  {
    icon: CreditCard,
    label: "Payment Methods",
    href: "/dashboard/payment-method",
  },
  {
    icon: Settings,
    label: "Appearance Settings",
    href: "/dashboard/settings",
  },
]

export default function DashboardSidebar({ userData }: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [businessName, setBusinessName] = useState("Rapid Ventures LLC")
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [showUploadOption, setShowUploadOption] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const { theme } = useTheme()
  const [timestamp, setTimestamp] = useState(Date.now()) // For cache busting
  const isMobile = useMobile()
  const { isOpen, close } = useSidebar()

  // Fetch the latest user data directly from the API
  useEffect(() => {
    const getLatestUserData = async () => {
      try {
        const latestUserData = await fetchUserProfile()
        if (latestUserData && latestUserData.image) {
          console.log("Setting profile image from API:", latestUserData.image)
          // Add timestamp to prevent caching
          setProfileImage(`${latestUserData.image}?t=${Date.now()}`)
        }
        if (latestUserData && latestUserData.businessName) {
          setBusinessName(latestUserData.businessName)
        }
      } catch (error) {
        console.error("Error fetching latest user data:", error)
      }
    }

    // Only fetch if we're authenticated
    if (status === "authenticated") {
      getLatestUserData()
    }
  }, [status])

  // Initialize from props and session as fallback
  useEffect(() => {
    // Only use these as fallbacks if we don't already have an image from the API
    if (!profileImage) {
      // First priority: Use the session data
      if (session?.user?.image) {
        console.log("Setting profile image from session:", session.user.image)
        setProfileImage(`${session.user.image}?t=${Date.now()}`)
      }
      // Second priority: Use the userData prop
      else if (userData?.image) {
        console.log("Setting profile image from userData:", userData.image)
        setProfileImage(`${userData.image}?t=${Date.now()}`)
      }
    }

    // Set business name if not already set
    if (!businessName && userData?.businessName) {
      setBusinessName(userData.businessName)
    }
  }, [session, userData, profileImage, businessName])

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile) {
      close()
    }
  }, [pathname, isMobile, close])

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) => (prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]))
  }

  const isActive = (href: string) => pathname === href

  const isPathStartingWith = (href: string) => {
    return pathname ? pathname.startsWith(href) : false
  }

  // Generate initials from business name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .substring(0, 2)
      .toUpperCase()
  }

  // Handle file upload with actual functionality
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Get the user ID from session or userData
    const userId = (session?.user as any)?.id || userData?.id
    if (!userId) {
      toast({
        title: "Upload failed",
        description: "User ID not found. Please try again after logging in.",
        variant: "destructive",
      })
      return
    }

    // Show local preview immediately
    const reader = new FileReader()
    reader.onload = (e) => {
      setProfileImage(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload to server
    setIsUploading(true)
    try {
      const imageUrl = await uploadProfileImage(file, userId)
      // Add timestamp to prevent caching
      setProfileImage(`${imageUrl}?t=${Date.now()}`)
      setTimestamp(Date.now()) // Update timestamp for cache busting

      toast({
        title: "Profile image updated",
        description: "Your profile image has been successfully updated.",
        variant: "default",
      })

      // Refresh the page to ensure all components have the latest data
      // This is a more direct approach than trying to update the session
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was a problem uploading your profile image.",
        variant: "destructive",
      })
      console.error(error)
    } finally {
      setIsUploading(false)
    }
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut({ redirect: false })
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
        variant: "default",
      })
      router.push("/auth/login")
    } catch (error) {
      console.error("Logout error:", error)
      toast({
        title: "Logout failed",
        description: "There was a problem logging you out.",
        variant: "destructive",
      })
    }
  }

  // Determine the image source to use with cache busting
  const imageSource = profileImage
    ? profileImage.includes("?t=")
      ? profileImage
      : `${profileImage}?t=${timestamp}`
    : "https://via.placeholder.com/80"

  console.log("Current profile image source:", imageSource)

  // Mobile sidebar with Sheet component
  // Remove this conditional rendering:
  // if (isMobile) {
  //   return (
  //     <Sheet open={isOpen} onOpenChange={close}>
  //       ...
  //     </Sheet>
  //   )
  // }

  // Always use the Sheet component
  return (
    <Sheet open={isOpen} onOpenChange={close}>
      <SheetContent side="left" className="p-0 w-[280px] sm:w-[320px]">
        <div
          className={`h-full flex flex-col ${
            theme === "dark"
              ? "bg-gray-900 text-white"
              : theme === "comfort"
                ? "bg-[#f8f4e3] text-[#5c4f3a]"
                : "bg-white"
          }`}
        >
          {/* Close button */}
          <Button variant="ghost" size="icon" className="absolute top-4 right-4" onClick={close}>
            <X className="h-5 w-5" />
            <span className="sr-only">Close menu</span>
          </Button>

          {/* Profile Picture and Business Name */}
          <div
            className={`p-6 border-b ${
              theme === "dark" ? "border-gray-700" : theme === "comfort" ? "border-[#e8e4d3]" : "border-gray-200"
            } flex flex-col items-center`}
          >
            <div
              className="relative mb-3"
              onMouseEnter={() => setShowUploadOption(true)}
              onMouseLeave={() => setShowUploadOption(false)}
            >
              {profileImage ? (
                <div className="w-16 h-16 rounded-full overflow-hidden relative">
                  <Image
                    src={imageSource || "/placeholder.svg"}
                    alt="Business Logo"
                    className="w-full h-full object-cover"
                    width={80}
                    height={80}
                    priority
                    unoptimized={imageSource.startsWith("data:")} // For data URLs
                  />
                  {showUploadOption && (
                    <label className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center cursor-pointer rounded-full">
                      <Upload className={`w-5 h-5 text-white ${isUploading ? "animate-spin" : ""}`} />
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                        accept="image/*"
                        disabled={isUploading}
                      />
                    </label>
                  )}
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-[#22c984] flex items-center justify-center text-white font-bold relative">
                  {getInitials(businessName)}
                  {showUploadOption && (
                    <label className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center cursor-pointer rounded-full">
                      <Upload className={`w-5 h-5 text-white ${isUploading ? "animate-spin" : ""}`} />
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                        accept="image/*"
                        disabled={isUploading}
                      />
                    </label>
                  )}
                </div>
              )}
            </div>
            <h2
              className={`text-sm font-medium ${
                theme === "dark" ? "text-white" : theme === "comfort" ? "text-[#5c4f3a]" : "text-gray-800"
              }`}
            >
              {businessName}
            </h2>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.label}>
                  {item.subItems ? (
                    <div>
                      <button
                        onClick={() => toggleExpand(item.label)}
                        className={cn(
                          "flex items-center w-full p-3 rounded-lg transition-colors",
                          theme === "dark"
                            ? "text-gray-300 hover:bg-gray-800"
                            : theme === "comfort"
                              ? "text-[#5c4f3a] hover:bg-[#efe9d8]"
                              : "text-gray-600 hover:bg-gray-100",
                          (expandedItems.includes(item.label) || isPathStartingWith(item.href)) &&
                            (theme === "dark" ? "bg-gray-800" : theme === "comfort" ? "bg-[#efe9d8]" : "bg-gray-100"),
                        )}
                      >
                        <item.icon className="w-5 h-5 mr-3" />
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronDown
                          className={cn(
                            "w-4 h-4 transition-transform",
                            (expandedItems.includes(item.label) || isPathStartingWith(item.href)) &&
                              "transform rotate-180",
                          )}
                        />
                      </button>
                      {(expandedItems.includes(item.label) || isPathStartingWith(item.href)) && (
                        <ul className="mt-2 ml-8 space-y-2">
                          {item.subItems.map((subItem) => (
                            <li key={subItem.href}>
                              <Link
                                href={subItem.href}
                                className={cn(
                                  "block p-2 rounded-lg transition-colors",
                                  theme === "dark"
                                    ? "text-gray-300 hover:bg-gray-800"
                                    : theme === "comfort"
                                      ? "text-[#5c4f3a] hover:bg-[#efe9d8]"
                                      : "text-gray-600 hover:bg-gray-100",
                                  isActive(subItem.href) &&
                                    (theme === "dark"
                                      ? "bg-gray-800 text-[#22c984]"
                                      : theme === "comfort"
                                        ? "bg-[#efe9d8] text-[#22c984]"
                                        : "bg-gray-100 text-[#22c984]"),
                                )}
                              >
                                {subItem.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center p-3 rounded-lg transition-colors",
                        theme === "dark"
                          ? "text-gray-300 hover:bg-gray-800"
                          : theme === "comfort"
                            ? "text-[#5c4f3a] hover:bg-[#efe9d8]"
                            : "text-gray-600 hover:bg-gray-100",
                        isActive(item.href) &&
                          (theme === "dark"
                            ? "bg-gray-800 text-[#22c984]"
                            : theme === "comfort"
                              ? "bg-[#efe9d8] text-[#22c984]"
                              : "bg-gray-100 text-[#22c984]"),
                      )}
                    >
                      <item.icon className="w-5 h-5 mr-3" />
                      <span>{item.label}</span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* Logout Button */}
          <div
            className={`p-4 border-t ${
              theme === "dark" ? "border-gray-700" : theme === "comfort" ? "border-[#e8e4d3]" : "border-gray-200"
            }`}
          >
            <button
              onClick={handleLogout}
              className={cn(
                "flex items-center w-full p-3 rounded-lg transition-colors",
                theme === "dark"
                  ? "text-gray-300 hover:bg-gray-800"
                  : theme === "comfort"
                    ? "text-[#5c4f3a] hover:bg-[#efe9d8]"
                    : "text-gray-600 hover:bg-gray-100",
              )}
            >
              <LogOut className="w-5 h-5 mr-3" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

