"use client"

import { ShoppingCart } from "lucide-react"
import { useCart } from "@/context/cart-context"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface CartIconProps {
  className?: string
}

export default function CartIcon({ className }: CartIconProps) {
  const { getItemCount } = useCart()
  const router = useRouter()
  const itemCount = getItemCount()

  return (
    <div className="relative" onClick={() => router.push("/checkout")}>
      <button className={cn("p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800", className)}>
        <ShoppingCart className="h-6 w-6" />
      </button>

      {itemCount > 0 && (
        <div className="absolute -top-2 -right-2 bg-[#22c984] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
          {itemCount > 9 ? "9+" : itemCount}
        </div>
      )}
    </div>
  )
}

