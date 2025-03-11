"use client"

import { createContext, useContext, useState, type ReactNode, useEffect } from "react"

interface CartItem {
  id: string
  tier: string
  price: number
  stateFee?: number
  state?: string
  discount?: number
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (itemId: string) => void
  clearCart: () => void
  getCartTotal: () => number
}

// Create context with default values
const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  clearCart: () => {},
  getCartTotal: () => 0,
})

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize cart from localStorage if available
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const savedCart = localStorage.getItem("cart")
        if (savedCart) {
          setItems(JSON.parse(savedCart))
        }
        setIsInitialized(true)
      }
    } catch (error) {
      console.error("Error initializing cart from localStorage:", error)
      setIsInitialized(true)
    }
  }, [])

  // Save cart to localStorage when it changes
  useEffect(() => {
    try {
      if (isInitialized && typeof window !== "undefined") {
        localStorage.setItem("cart", JSON.stringify(items))
      }
    } catch (error) {
      console.error("Error saving cart to localStorage:", error)
    }
  }, [items, isInitialized])

  const addItem = (item: CartItem) => {
    try {
      setItems((prevItems) => [...prevItems, item])
    } catch (error) {
      console.error("Error adding item to cart:", error)
    }
  }

  const removeItem = (itemId: string) => {
    try {
      setItems((prevItems) => prevItems.filter((item) => item.id !== itemId))
    } catch (error) {
      console.error("Error removing item from cart:", error)
    }
  }

  const clearCart = () => {
    try {
      setItems([])
    } catch (error) {
      console.error("Error clearing cart:", error)
    }
  }

  const getCartTotal = () => {
    try {
      return items.reduce((total, item) => {
        let itemTotal = item.price
        if (item.stateFee) {
          itemTotal += item.stateFee
        }
        if (item.discount) {
          itemTotal -= item.discount
        }
        return total + itemTotal
      }, 0)
    } catch (error) {
      console.error("Error calculating cart total:", error)
      return 0
    }
  }

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart, getCartTotal }}>
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

