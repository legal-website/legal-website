"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Create a simple Command component that mimics the cmdk API
const Command = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void }
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
      className,
    )}
    {...props}
  />
))
Command.displayName = "Command"

const CommandInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    onValueChange?: (value: string) => void
  }
>(({ className, onValueChange, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    onChange={(e) => onValueChange?.(e.target.value)}
    {...props}
  />
))
CommandInput.displayName = "CommandInput"

const CommandGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("overflow-hidden p-1 text-foreground", className)} {...props} />
  ),
)
CommandGroup.displayName = "CommandGroup"

const CommandItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    onSelect?: () => void
  }
>(({ className, onSelect, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    onClick={onSelect}
    {...props}
  />
))
CommandItem.displayName = "CommandItem"

// Create a namespace for the Command component
namespace CommandPrimitive {
  export const Input = CommandInput
}

export { Command, CommandGroup, CommandItem, CommandPrimitive }

