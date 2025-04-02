"use client"

import { Menu, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/context/theme-context"
import { cn } from "@/lib/utils"
import { useMobile } from "@/hooks/use-mobile"
import { useSidebar } from "@/context/sidebar-context"

export default function DashboardNavbar() {
  const { theme } = useTheme()
  const isMobile = useMobile()
  const { toggle } = useSidebar()

  return (
    <header
      className={cn(
        "w-full border-b sticky top-0 z-40",
        theme === "dark"
          ? "bg-gray-900 border-gray-700 text-white"
          : theme === "comfort"
            ? "bg-[#f8f4e3] border-[#e8e4d3] text-[#5c4f3a]"
            : "bg-white border-gray-200",
      )}
    >
      <div className="container flex h-16 items-center px-4">
        {/* Always show hamburger menu */}
        <Button variant="ghost" size="icon" className="mr-2" onClick={toggle} aria-label="Toggle sidebar">
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex items-center">
          <div className="flex items-center">
            <LayoutDashboard className="h-5 w-5 mr-2" />
            <span className="font-bold text-xl">MY Dashboard</span>
          </div>
        </div>

        <div className="flex-1"></div>

        <div className="flex items-center gap-2">{/* Add any additional navbar items here */}</div>
      </div>
    </header>
  )
}

