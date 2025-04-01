"use client"

import { X } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import CartDropdown from "./cart-dropdown"

interface MobileCartDialogProps {
  isOpen: boolean
  onClose: () => void
}

export default function MobileCartDialog({ isOpen, onClose }: MobileCartDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[1000] md:hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      <div className="fixed inset-x-0 bottom-16 mx-auto max-w-md p-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="bg-white rounded-lg shadow-xl max-h-[70vh] overflow-auto"
        >
          <div className="sticky top-0 bg-white p-3 border-b flex justify-between items-center">
            <h2 className="font-semibold text-lg">Your Cart</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="p-1">
            <CartDropdown />
          </div>
        </motion.div>
      </div>
    </div>
  )
}

