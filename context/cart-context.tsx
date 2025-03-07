"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export interface CartItem {
  id: string
  tier: string
  price: number
  state?: string
  stateFee?: number
  discount?: number
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, "id">) => void
  removeItem: (id: string) => void
  clearCart: () => void
  isInCart: (tier: string, state?: string) => boolean
  getCartTotal: () => number
  itemCount: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [loaded, setLoaded] = useState(false)

  // Load cart from localStorage on mount
  useEffect(() => {
    const storedCart = localStorage.getItem("cart")
    if (storedCart) {
      try {
        setItems(JSON.parse(storedCart))
      } catch (e) {
        console.error("Failed to parse cart from localStorage", e)
      }
    }
    setLoaded(true)
  }, [])

  // Save cart to localStorage when it changes
  useEffect(() => {
    if (loaded) {
      localStorage.setItem("cart", JSON.stringify(items))
    }
  }, [items, loaded])

  const addItem = (item: Omit<CartItem, "id">) => {
    // Generate a unique ID
    const id = Math.random().toString(36).substring(2, 9)
    setItems((prev) => [...prev, { ...item, id }])
  }

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const clearCart = () => {
    setItems([])
  }

  const isInCart = (tier: string, state?: string) => {
    return items.some((item) => item.tier === tier && ((!state && !item.state) || state === item.state))
  }

  const getCartTotal = () => {
    return items.reduce((total, item) => {
      let itemTotal = item.price
      if (item.stateFee) itemTotal += item.stateFee
      if (item.discount) itemTotal -= item.discount
      return total + itemTotal
    }, 0)
  }

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        clearCart,
        isInCart,
        getCartTotal,
        itemCount: items.length,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}

