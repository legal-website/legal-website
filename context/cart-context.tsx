"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface CartItem {
  id?: string
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
  isInCart: (tier: string, state?: string) => boolean
  getItemCount: () => number // Add this new function
}

// Create context with default values
const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  clearCart: () => {},
  getCartTotal: () => 0,
  isInCart: () => false,
  getItemCount: () => 0, // Add default implementation
})

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  const addItem = (item: CartItem) => {
    try {
      // Generate an ID if one isn't provided
      const newItem = {
        ...item,
        id: item.id || `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      }
      setItems((prevItems) => [...prevItems, newItem])
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

  // Add the isInCart function
  const isInCart = (tier: string, state?: string) => {
    try {
      return items.some((item) => {
        // If state is provided, check both tier and state
        if (state) {
          return item.tier === tier && item.state === state
        }
        // Otherwise just check the tier
        return item.tier === tier
      })
    } catch (error) {
      console.error("Error checking if item is in cart:", error)
      return false
    }
  }

  // Add this function inside the CartProvider before the return statement
  const getItemCount = () => {
    try {
      return items.length
    } catch (error) {
      console.error("Error getting item count:", error)
      return 0
    }
  }

  // Update the context provider value to include the new function
  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart, getCartTotal, isInCart, getItemCount }}>
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

