"use client"

import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/context/theme-context"
import { cn } from "@/lib/utils"
import { useMobile } from "@/hooks/use-mobile"
import Image from "next/image"
import Link from "next/link"
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
        {isMobile && (
          <Button variant="ghost" size="icon" className="mr-2" onClick={toggle} aria-label="Toggle sidebar">
            <Menu className="h-5 w-5" />
          </Button>
        )}

        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <Image
              src="/placeholder.svg?height=40&width=40"
              alt="Orizen Logo"
              width={40}
              height={40}
              className="mr-2"
            />
            <span className="font-bold text-xl">Orizen</span>
          </Link>
        </div>

        <div className="flex-1"></div>

        <div className="flex items-center gap-2">{/* Add any additional navbar items here */}</div>
      </div>
    </header>
  )
}

