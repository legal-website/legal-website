"use client"

import { useCart } from "@/context/cart-context"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { ShoppingCart, X } from "lucide-react"

export default function CartDropdown() {
  const { items, removeItem, getCartTotal } = useCart()
  const router = useRouter()

  if (items.length === 0) {
    return (
      <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-md shadow-lg z-50 p-4">
        <div className="text-center py-6">
          <ShoppingCart className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <p className="text-gray-500">Your cart is empty</p>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50 overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Your Cart ({items.length})</h3>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {items.map((item) => (
          <div key={item.id} className="p-4 border-b flex justify-between items-start">
            <div>
              <p className="font-medium">{item.tier} Package</p>
              {item.state && <p className="text-sm text-gray-600">State: {item.state}</p>}
              <p className="text-[#22c984] font-medium">${item.price + (item.stateFee || 0) - (item.discount || 0)}</p>
            </div>
            <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="p-4 border-t bg-gray-50">
        <div className="flex justify-between mb-4">
          <span className="font-semibold">Total:</span>
          <span className="font-semibold">${getCartTotal()}</span>
        </div>

        <div className="space-y-2">
          <Button
            className="w-full bg-[#22c984] hover:bg-[#1eac73] text-white"
            onClick={() => router.push("/checkout")}
          >
            Buy Now
          </Button>

          <Button variant="outline" className="w-full" onClick={() => router.push("/cart")}>
            View Cart
          </Button>
        </div>
      </div>
    </div>
  )
}

