"use client"
import Image from "next/image"
import { useCart } from "@/context/cart-context"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { ShoppingCart, Trash2, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function CartPage() {
  const { items, removeItem, clearCart, getCartTotal } = useCart()
  const router = useRouter()

  if (items.length === 0) {
    return (
      <div className="container mx-auto py-16 mb-48 px-[6%]">
        <div className="max-w-md mx-auto text-center">
          <ShoppingCart className="mx-auto h-16 w-16 text-gray-300 mb-6" />
          <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
          <p className="text-gray-600 mb-8">Looks like you haven&apos;t added any LLC packages to your cart yet.</p>
          <Link href="/">
            <Button className="bg-[#22c984] hover:bg-[#1eac73] text-white">Browse Packages</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-12 px-[6%] mb-48">
      <Button variant="ghost" className="mb-8" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <h1 className="text-3xl font-bold mb-8">Your Cart</h1>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h2 className="font-semibold">Items ({items.length})</h2>
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-red-500" onClick={clearCart}>
                <Trash2 className="h-4 w-4 mr-2" /> Clear Cart
              </Button>
            </div>

            <div className="divide-y">
              {items.map((item) => (
                <div key={item.id} className="p-6 flex flex-col md:flex-row justify-between">
                  <div>
                    <h3 className="font-medium text-lg">{item.tier} Package</h3>
                    {item.state && <p className="text-gray-600 mt-1">State: {item.state}</p>}
                    <div className="mt-2 text-sm text-gray-500">
                      <p>Base price: ${item.price}</p>
                      {item.stateFee && <p>State filing fee: ${item.stateFee}</p>}
                      {item.discount && <p className="text-[#22c984]">Discount: -${item.discount}</p>}
                    </div>
                  </div>

                  <div className="flex flex-col items-end mt-4 md:mt-0">
                    <p className="text-xl font-bold">${item.price + (item.stateFee || 0) - (item.discount || 0)}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-500 hover:text-red-500 mt-2"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-lg shadow p-6 sticky top-8">
            <h2 className="font-semibold text-lg mb-4">Order Summary</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>${getCartTotal()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span>$0.00</span>
              </div>
              <div className="border-t pt-3 mt-3 flex justify-between font-bold">
                <span>Total</span>
                <span>${getCartTotal()}</span>
              </div>
            </div>

            <Button
              className="w-full bg-[#22c984] hover:bg-[#1eac73] text-white"
              onClick={() => router.push("/checkout")}
            >
              Proceed to Checkout
            </Button>

            <div className="mt-6 text-sm text-gray-500">
              <p className="mb-2">We accept:</p>
              <div className="flex space-x-2">
<Image src="/Visa.svg" alt="Visa" className="h-20" width={80} height={80} />
<Image src="/mastercard.svg" alt="Mastercard" className="h-20" width={80} height={80} />
<Image src="/amex.svg" alt="Amex" className="h-20" width={80} height={80} />
<Image src="/stripe.svg" alt="Stripe" className="h-20" width={80} height={80} />

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}