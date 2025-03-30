"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useTheme } from "@/context/theme-context"
import { Button } from "@/components/ui/button"
import { signOut, useSession } from "next-auth/react"
import Image from "next/image"
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  Tag,
  BarChart3,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Ticket,
  CreditCard,
  MessageCircle,
  Upload,
} from "lucide-react"

interface MenuItem {
  icon: React.ElementType
  label: string
  href: string
  badge?: number | string
  badgeKey?: string // Add this to identify which counter this item uses
  subItems?: {
    label: string
    href: string
    badge?: number | string
    badgeKey?: string // Add this for sub-items too
  }[]
}

const menuItems: MenuItem[] = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    href: "/admin",
  },
  {
    icon: Users,
    label: "User Management",
    href: "/admin/users",
    badge: 3,
    badgeKey: "userManagement",
    subItems: [
      { label: "All Users", href: "/admin/users/all" },
      { label: "Pending Approvals", href: "/admin/users/pending", badge: 3, badgeKey: "pendingApprovals" },
      { label: "User Roles", href: "/admin/users/roles" },
    ],
  },
  {
    icon: FileText,
    label: "Document Management",
    href: "/admin/documents",
    badgeKey: "documents",
    subItems: [
      { label: "Templates", href: "/admin/documents/templates", badgeKey: "templates" },
      { label: "Client Documents", href: "/admin/documents/client", badgeKey: "clientDocuments" },
    ],
  },
  {
    icon: Tag,
    label: "Promotions",
    href: "/admin/promotions",
    badge: "New",
    badgeKey: "promotions",
    subItems: [
      { label: "Coupons", href: "/admin/promotions/coupons", badgeKey: "coupons" },
      { label: "Campaigns", href: "/admin/promotions/campaigns", badgeKey: "campaigns" },
    ],
  },
  {
    icon: BarChart3,
    label: "Orizen Analytics",
    href: "/admin/orizen-analytics",
    badgeKey: "analytics",
  },
  {
    icon: MessageCircle,
    label: "Community",
    href: "/admin/community",
    badge: "New",
    badgeKey: "community",
    subItems: [
      { label: "Manage Posts", href: "/admin/community", badgeKey: "managePosts" },
      { label: "Moderation", href: "/admin/community/moderation", badgeKey: "moderation" },
    ],
  },
  {
    icon: BarChart3,
    label: "Analytics",
    href: "/admin/analytics",
    badgeKey: "analytics",
  },
  {
    icon: CreditCard,
    label: "Billing",
    href: "/admin/billing",
    badgeKey: "billing",
    subItems: [
      { label: "Invoices", href: "/admin/billing/invoices", badgeKey: "invoices" },
      { label: "Subscriptions", href: "/admin/billing/subscriptions", badgeKey: "subscriptions" },
      { label: "Payment Methods", href: "/admin/billing/payment-methods", badgeKey: "paymentMethods" },
    ],
  },
  {
    icon: Ticket,
    label: "Support Tickets",
    href: "/admin/tickets",
    badge: 12,
    badgeKey: "tickets",
  },
  {
    icon: Shield,
    label: "Compliance",
    href: "/admin/compliance",
    badgeKey: "compliance",
    subItems: [
      { label: "Amendments", href: "/admin/compliance/amendments", badge: "New", badgeKey: "amendments" },
      { label: "Annual Reports", href: "/admin/compliance/annual-reports", badgeKey: "annualReports" },
      {
        label: "Beneficial Ownership",
        href: "/admin/compliance/beneficial-ownership",
        badgeKey: "beneficialOwnership",
      },
    ],
  },
  {
    icon: Settings,
    label: "System Settings",
    href: "/admin/settings",
    badgeKey: "settings",
  },
]

// Async function to fetch user profile
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

export default function AdminSidebar() {
  const pathname = usePathname() || "" // Provide default empty string if null
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const { theme } = useTheme()
  const { data: session, status } = useSession()
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string>("User")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [timestamp, setTimestamp] = useState(Date.now())

  // Replace the initial counter state with an empty object to avoid showing dummy data
  const [counters, setCounters] = useState<Record<string, number | string | null>>({})

  // Fetch user profile data including profile image
  useEffect(() => {
    const getProfileData = async () => {
      if (status === "authenticated") {
        try {
          const userData = await fetchUserProfile()
          if (userData && userData.image) {
            // Add timestamp to prevent caching
            setProfileImage(`${userData.image}?t=${Date.now()}`)
          }
          if (userData && userData.name) {
            setUserName(userData.name)
          }
          if (userData && userData.role) {
            setUserRole(userData.role)
          }
        } catch (error) {
          console.error("Error fetching profile data:", error)
        }
      }
    }

    getProfileData()
  }, [status, timestamp])

  // Handle profile picture upload - similar to navbar implementation
  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !session?.user) return

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("userId", (session.user as any).id)

      const response = await fetch("/api/user/profile-image", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (data.success && data.imageUrl) {
        // Update the profile image with cache busting
        setProfileImage(`${data.imageUrl}?t=${Date.now()}`)
        // Update timestamp to trigger a re-fetch
        setTimestamp(Date.now())
      } else {
        console.error("Failed to upload profile image:", data.error)
      }
    } catch (error) {
      console.error("Error uploading profile image:", error)
    } finally {
      setIsUploading(false)
    }
  }

  // Function to get user initials for avatar fallback
  const getUserInitials = (): string => {
    if (!userName) return "U"

    const nameParts = userName.split(" ")
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
    }

    return userName.substring(0, 2).toUpperCase()
  }

  // Function to get formatted role name
  const getFormattedRole = (): string => {
    if (!userRole) return "User"

    // Convert role like "ADMIN" to "Admin" or "SUPER_ADMIN" to "Super Admin"
    return userRole
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ")
  }

  // Function to update a counter
  const updateCounter = (key: string, value: number | string) => {
    setCounters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  // Function to increment a counter
  const incrementCounter = (key: string) => {
    setCounters((prev) => {
      const currentValue = prev[key]
      if (typeof currentValue === "number") {
        return {
          ...prev,
          [key]: currentValue + 1,
        }
      }
      return prev
    })
  }

  // Now let's update the sidebar component to properly use our counter system

  // Update the useEffect hook that listens for counter events
  useEffect(() => {
    // Load initial counters from localStorage
    const storedCounters = localStorage.getItem("admin-counters")
    if (storedCounters) {
      try {
        const parsedCounters = JSON.parse(storedCounters)
        setCounters(parsedCounters)
      } catch (error) {
        console.error("Error parsing stored counters:", error)
      }
    }

    // Listen for counter update events
    const handleCounterUpdate = (event: CustomEvent) => {
      const { key, value } = event.detail
      setCounters((prev) => ({
        ...prev,
        [key]: value,
      }))
    }

    // Listen for counter clear events
    const handleCounterClear = () => {
      setCounters({})
    }

    // Listen for counter increment events
    const handleCounterIncrement = (event: CustomEvent) => {
      const { key } = event.detail
      setCounters((prev) => {
        const currentValue = prev[key]
        if (typeof currentValue === "number") {
          return {
            ...prev,
            [key]: currentValue + 1,
          }
        }
        return {
          ...prev,
          [key]: 1,
        }
      })
    }

    // Add event listeners
    window.addEventListener("admin:counter-update" as any, handleCounterUpdate as EventListener)
    window.addEventListener("admin:counter-clear" as any, handleCounterClear as EventListener)
    window.addEventListener("admin:counter-increment" as any, handleCounterIncrement as EventListener)

    // Clean up
    return () => {
      window.removeEventListener("admin:counter-update" as any, handleCounterUpdate as EventListener)
      window.removeEventListener("admin:counter-clear" as any, handleCounterClear as EventListener)
      window.addEventListener("admin:counter-increment" as any, handleCounterIncrement as EventListener)
    }
  }, [])

  // Helper function to get the current badge value for an item
  const getBadgeValue = (
    item: MenuItem | (MenuItem["subItems"] extends undefined ? never : NonNullable<MenuItem["subItems"]>[number]),
  ) => {
    if (!item.badgeKey) return item.badge
    const counterValue = counters[item.badgeKey]
    return counterValue !== null ? counterValue : item.badge
  }

  // Rest of the component remains the same, but we'll update the badge rendering

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) => (prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]))
  }

  const isActive = (href: string) => pathname === href

  const handleLogout = async () => {
    await signOut({
      redirect: true,
      callbackUrl: "https://legal-website-five.vercel.app/login?callbackUrl=/admin",
    })
  }

  return (
    <div
      className={cn(
        "border-r transition-all duration-300 h-screen flex flex-col",
        collapsed ? "w-20" : "w-64",
        theme === "dark"
          ? "bg-gray-900 border-gray-800 text-white"
          : theme === "comfort"
            ? "bg-[#f8f4e3] border-[#e8e4d3] text-[#5c4f3a]"
            : "bg-white border-gray-200",
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "p-4 border-b flex items-center justify-between",
          theme === "dark" ? "border-gray-800" : theme === "comfort" ? "border-[#e8e4d3]" : "border-gray-200",
        )}
      >
        {!collapsed && (
          <div className="flex items-center">
            {profileImage ? (
              <div className="w-8 h-8 rounded-md overflow-hidden mr-2">
                <Image
                  src={profileImage || "/placeholder.svg"}
                  alt={userName || "Admin"}
                  width={32}
                  height={32}
                  className="object-cover w-full h-full"
                  unoptimized={profileImage.startsWith("data:")}
                />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-md bg-purple-600 flex items-center justify-center text-white font-bold mr-2">
                {getUserInitials()}
              </div>
            )}
            <h1 className="text-lg font-bold">{getFormattedRole()}</h1>
          </div>
        )}
        {collapsed &&
          (profileImage ? (
            <div className="w-10 h-10 rounded-md overflow-hidden mx-auto">
              <Image
                src={profileImage || "/placeholder.svg"}
                alt={userName || "Admin"}
                width={40}
                height={40}
                className="object-cover w-full h-full"
                unoptimized={profileImage.startsWith("data:")}
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-md bg-purple-600 flex items-center justify-center text-white font-bold mx-auto">
              {getUserInitials()}
            </div>
          ))}
        <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className="ml-auto">
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {menuItems.map((item) => (
            <li key={item.label}>
              {item.subItems ? (
                <div>
                  <button
                    onClick={() => toggleExpand(item.label)}
                    className={cn(
                      "flex items-center w-full p-2 rounded-lg transition-colors",
                      collapsed ? "justify-center" : "justify-between",
                      theme === "dark"
                        ? "text-gray-300 hover:bg-gray-800"
                        : theme === "comfort"
                          ? "text-[#5c4f3a] hover:bg-[#efe9d8]"
                          : "text-gray-700 hover:bg-gray-100",
                      (expandedItems.includes(item.label) || pathname.startsWith(item.href)) &&
                        (theme === "dark" ? "bg-gray-800" : theme === "comfort" ? "bg-[#efe9d8]" : "bg-gray-100"),
                    )}
                  >
                    <div className="flex items-center">
                      <item.icon className={cn("w-5 h-5", collapsed ? "" : "mr-3")} />
                      {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
                    </div>
                    {!collapsed && (
                      <>
                        {getBadgeValue(item) !== null && (
                          <span className="px-2 py-0.5 ml-2 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                            {getBadgeValue(item)}
                          </span>
                        )}
                        <ChevronRight
                          className={cn(
                            "w-4 h-4 ml-2 transition-transform",
                            expandedItems.includes(item.label) && "transform rotate-90",
                          )}
                        />
                      </>
                    )}
                  </button>
                  {!collapsed && expandedItems.includes(item.label) && (
                    <ul className="mt-1 ml-6 space-y-1">
                      {item.subItems.map((subItem) => (
                        <li key={subItem.href}>
                          <Link
                            href={subItem.href}
                            className={cn(
                              "flex items-center justify-between p-2 rounded-lg transition-colors",
                              theme === "dark"
                                ? "text-gray-300 hover:bg-gray-800"
                                : theme === "comfort"
                                  ? "text-[#5c4f3a] hover:bg-[#efe9d8]"
                                  : "text-gray-700 hover:bg-gray-100",
                              isActive(subItem.href) &&
                                (theme === "dark"
                                  ? "bg-gray-800 text-purple-400"
                                  : theme === "comfort"
                                    ? "bg-[#efe9d8] text-purple-600"
                                    : "bg-gray-100 text-purple-600"),
                            )}
                          >
                            <span>{subItem.label}</span>
                            {getBadgeValue(subItem) !== null && (
                              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                {getBadgeValue(subItem)}
                              </span>
                            )}
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
                    "flex items-center p-2 rounded-lg transition-colors",
                    collapsed ? "justify-center" : "justify-between",
                    theme === "dark"
                      ? "text-gray-300 hover:bg-gray-800"
                      : theme === "comfort"
                        ? "text-[#5c4f3a] hover:bg-[#efe9d8]"
                        : "text-gray-700 hover:bg-gray-100",
                    isActive(item.href) &&
                      (theme === "dark"
                        ? "bg-gray-800 text-purple-400"
                        : theme === "comfort"
                          ? "bg-[#efe9d8] text-purple-600"
                          : "bg-gray-100 text-purple-600"),
                  )}
                >
                  <div className="flex items-center">
                    <item.icon className={cn("w-5 h-5", collapsed ? "" : "mr-3")} />
                    {!collapsed && <span>{item.label}</span>}
                  </div>
                  {!collapsed && getBadgeValue(item) !== null && (
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      {getBadgeValue(item)}
                    </span>
                  )}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div
        className={cn(
          "p-4 border-t",
          theme === "dark" ? "border-gray-800" : theme === "comfort" ? "border-[#e8e4d3]" : "border-gray-200",
        )}
      >
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center">
              <div className="relative cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                {profileImage ? (
                  <div className="w-8 h-8 rounded-full overflow-hidden">
                    <Image
                      src={profileImage || "/placeholder.svg"}
                      alt={userName || "User"}
                      width={32}
                      height={32}
                      className="object-cover w-full h-full"
                      unoptimized={profileImage.startsWith("data:")}
                    />
                    <div className="absolute -bottom-1 -right-1 rounded-full bg-white dark:bg-gray-800 p-0.5">
                      <Upload size={10} className="text-gray-500" />
                    </div>
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <span className="text-purple-600 font-medium">{getUserInitials()}</span>
                    <div className="absolute -bottom-1 -right-1 rounded-full bg-white dark:bg-gray-800 p-0.5">
                      <Upload size={10} className="text-gray-500" />
                    </div>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleProfilePictureUpload}
                  disabled={isUploading}
                />
              </div>
              <div className="ml-2">
                <p className="text-sm font-medium">{userName || "Loading..."}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{getFormattedRole()}</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="relative cursor-pointer mx-auto" onClick={() => fileInputRef.current?.click()}>
              {profileImage ? (
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  <Image
                    src={profileImage || "/placeholder.svg"}
                    alt={userName || "User"}
                    width={32}
                    height={32}
                    className="object-cover w-full h-full"
                    unoptimized={profileImage.startsWith("data:")}
                  />
                  <div className="absolute -bottom-1 -right-1 rounded-full bg-white dark:bg-gray-800 p-0.5">
                    <Upload size={10} className="text-gray-500" />
                  </div>
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-purple-600 font-medium">{getUserInitials()}</span>
                  <div className="absolute -bottom-1 -right-1 rounded-full bg-white dark:bg-gray-800 p-0.5">
                    <Upload size={10} className="text-gray-500" />
                  </div>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleProfilePictureUpload}
                disabled={isUploading}
              />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn(collapsed && !profileImage ? "mx-auto" : "")}
            title="Logout"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

