import { toast as originalToast, useToast } from "@/components/ui/use-toast"
import type { ReactNode } from "react"

// Define the exact types that match what the original toast expects
type ToastVariant = "default" | "destructive"

// Define our extended variant type
type ExtendedVariant = ToastVariant | "warning"

// Create a type that matches exactly what the original toast expects
type OriginalToastProps = Parameters<typeof originalToast>[0]

// Create our extended toast props type
interface ExtendedToastProps {
  title?: string | ReactNode
  description?: string | ReactNode
  variant?: ExtendedVariant
  className?: string
  duration?: number
  onOpenChange?: (open: boolean) => void
}

// Create our custom toast function
export function toast(props: ExtendedToastProps) {
  const { variant = "default", className = "", ...restProps } = props

  // Handle the warning variant by mapping it to default with custom styling
  let finalVariant: ToastVariant = "default"
  let finalClassName = className

  if (variant === "destructive") {
    finalVariant = "destructive"
  } else if (variant === "warning") {
    finalVariant = "default"
    finalClassName = `bg-yellow-100 border-yellow-400 text-yellow-800 ${className}`
  }

  // Call the original toast with the mapped variant and additional styling
  return originalToast({
    ...restProps,
    variant: finalVariant,
    className: finalClassName,
  } as OriginalToastProps) // Use type assertion to ensure compatibility
}

// Re-export the useToast hook
export { useToast }

