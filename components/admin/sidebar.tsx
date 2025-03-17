"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useTheme } from "@/context/theme-context"
import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  Tag,
  Bell,
  BarChart3,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Ticket,
  CreditCard,
} from "lucide-react"

interface MenuItem {
  icon: React.ElementType
  label: string
  href: string
  badge?: number | string
  subItems?: { label: string; href: string; badge?: number | string }[]
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
    subItems: [
      { label: "All Users", href: "/admin/users/all" },
      { label: "Pending Approvals", href: "/admin/users/pending", badge: 3 },
      { label: "User Roles", href: "/admin/users/roles" },
    ],
  },
  {
    icon: FileText,
    label: "Document Management",
    href: "/admin/documents",
    subItems: [
      { label: "Templates", href: "/admin/documents/templates" },
      { label: "Client Documents", href: "/admin/documents/client" },
      { label: "Bulk Upload", href: "/admin/documents/upload" },
    ],
  },
  {
    icon: Tag,
    label: "Promotions",
    href: "/admin/promotions",
    badge: "New",
    subItems: [
      { label: "Deals", href: "/admin/promotions/deals" },
      { label: "Coupons", href: "/admin/promotions/coupons" },
      { label: "Campaigns", href: "/admin/promotions/campaigns" },
    ],
  },
  {
    icon: Bell,
    label: "Notifications",
    href: "/admin/notifications",
  },
  {
    icon: BarChart3,
    label: "Analytics",
    href: "/admin/analytics",
  },
  {
    icon: CreditCard,
    label: "Billing",
    href: "/admin/billing",
    subItems: [
      { label: "Invoices", href: "/admin/billing/invoices" },
      { label: "Subscriptions", href: "/admin/billing/payment-methods" },
      { label: "Payment Methods", href: "/admin/billing/payment-methods" },
    ],
  },
  {
    icon: Ticket,
    label: "Support Tickets",
    href: "/admin/tickets",
    badge: 12,
  },
  {
    icon: Shield,
    label: "Compliance",
    href: "/admin/compliance",
  },
  {
    icon: Settings,
    label: "System Settings",
    href: "/admin/settings",
  },
]

export default function AdminSidebar() {
  const pathname = usePathname() || "" // Provide default empty string if null
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const { theme } = useTheme()

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
            <div className="w-8 h-8 rounded-md bg-purple-600 flex items-center justify-center text-white font-bold mr-2">
              SA
            </div>
            <h1 className="text-lg font-bold">Super Admin</h1>
          </div>
        )}
        {collapsed && (
          <div className="w-10 h-10 rounded-md bg-purple-600 flex items-center justify-center text-white font-bold mx-auto">
            SA
          </div>
        )}
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
                        {item.badge && (
                          <span className="px-2 py-0.5 ml-2 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                            {item.badge}
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
                            {subItem.badge && (
                              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                {subItem.badge}
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
                  {!collapsed && item.badge && (
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      {item.badge}
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
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-purple-600 font-medium">JD</span>
              </div>
              <div className="ml-2">
                <p className="text-sm font-medium">John Doe</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Super Admin</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn(collapsed && "mx-auto")}
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

