"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/context/theme-context"

interface MenuItem {
  icon: React.ElementType
  label: string
  href: string
  subItems?: { label: string; href: string }[]
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
    icon: Settings,
    label: "Settings",
    href: "/dashboard/settings",
  },
]

export default function DashboardSidebar() {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [businessName] = useState("Rapid Ventures LLC")
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [showUploadOption, setShowUploadOption] = useState(false)
  const { theme } = useTheme()

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

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div
      className={`w-64 border-r h-screen flex flex-col ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : theme === "comfort" ? "bg-[#f8f4e3] border-[#e8e4d3] text-[#5c4f3a]" : "bg-white border-gray-200"}`}
    >
      {/* Profile Picture and Business Name */}
      <div
        className={`p-6 border-b ${theme === "dark" ? "border-gray-700" : theme === "comfort" ? "border-[#e8e4d3]" : "border-gray-200"} flex flex-col items-center`}
      >
        <div
          className="relative mb-3"
          onMouseEnter={() => setShowUploadOption(true)}
          onMouseLeave={() => setShowUploadOption(false)}
        >
          {profileImage ? (
            <div className="w-16 h-16 rounded-full overflow-hidden relative">
              <Image
                src={profileImage || "/placeholder.svg"}
                alt="Business Logo"
                className="w-full h-full object-cover"
                width={80}
                height={80}
                priority
              />
              {showUploadOption && (
                <label className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center cursor-pointer rounded-full">
                  <Upload className="w-5 h-5 text-white" />
                  <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
                </label>
              )}
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#22c984] flex items-center justify-center text-white font-bold relative">
              {getInitials(businessName)}
              {showUploadOption && (
                <label className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center cursor-pointer rounded-full">
                  <Upload className="w-5 h-5 text-white" />
                  <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
                </label>
              )}
            </div>
          )}
        </div>
        <h2
          className={`text-sm font-medium ${theme === "dark" ? "text-white" : theme === "comfort" ? "text-[#5c4f3a]" : "text-gray-800"}`}
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
                        (expandedItems.includes(item.label) || isPathStartingWith(item.href)) && "transform rotate-180",
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
        className={`p-4 border-t ${theme === "dark" ? "border-gray-700" : theme === "comfort" ? "border-[#e8e4d3]" : "border-gray-200"}`}
      >
        <button
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
  )
}

