"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, FileText, MessageSquare, Building, Users, Settings, LogOut, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

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
    icon: MessageSquare,
    label: "Communication",
    href: "/dashboard/communication",
  },
  {
    icon: Users,
    label: "Affiliate Program",
    href: "/dashboard/affiliate",
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

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) => (prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]))
  }

  const isActive = (href: string) => pathname === href

  return (
    <div className="w-64 bg-white border-r h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b">
        <Link href="/">
          <div className="h-8 relative">
            <Image src="/logo.png" alt="Orizen Logo" width={170} height={32} className="object-contain" />
          </div>
        </Link>
      </div>

      {/* Business Selector */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between bg-gray-50 rounded-md p-2">
          <span className="text-sm font-medium">Rapid Ventures LLC</span>
          <svg className="w-5 h-5 text-[#22c984]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
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
                      "flex items-center w-full p-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors",
                      expandedItems.includes(item.label) && "bg-gray-100",
                    )}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    <span className="flex-1 text-left">{item.label}</span>
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 transition-transform",
                        expandedItems.includes(item.label) && "transform rotate-180",
                      )}
                    />
                  </button>
                  {expandedItems.includes(item.label) && (
                    <ul className="mt-2 ml-8 space-y-2">
                      {item.subItems.map((subItem) => (
                        <li key={subItem.href}>
                          <Link
                            href={subItem.href}
                            className={cn(
                              "block p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors",
                              isActive(subItem.href) && "bg-gray-100 text-[#22c984] font-medium",
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
                    "flex items-center p-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors",
                    isActive(item.href) && "bg-gray-100 text-[#22c984] font-medium",
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
      <div className="p-4 border-t">
        <button className="flex items-center w-full p-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
          <LogOut className="w-5 h-5 mr-3" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  )
}

