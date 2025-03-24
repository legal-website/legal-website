"use client"

import * as React from "react"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Option = {
  value: string
  label: string
}

interface MultiSelectProps {
  options: Option[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  className?: string
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select options...",
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")
  const containerRef = React.useRef<HTMLDivElement>(null)

  const handleUnselect = (option: string) => {
    onChange(selected.filter((s) => s !== option))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Delete" || e.key === "Backspace") {
      if (e.currentTarget.value === "" && selected.length > 0) {
        onChange(selected.slice(0, -1))
      }
    }
    // Close dropdown on escape
    if (e.key === "Escape") {
      setOpen(false)
    }
  }

  // Filter options based on input value and already selected items
  const filteredOptions = options.filter(
    (option) => !selected.includes(option.value) && option.label.toLowerCase().includes(inputValue.toLowerCase()),
  )

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div className="flex flex-wrap gap-1 p-2 border rounded-md bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        {selected.map((value) => {
          const selectedOption = options.find((o) => o.value === value)
          return (
            <Badge key={value} variant="secondary" className="mb-1">
              {selectedOption?.label || value}
              <button
                type="button"
                className="ml-1 rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                onClick={() => handleUnselect(value)}
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </button>
            </Badge>
          )
        })}
        <input
          className="flex-1 bg-transparent outline-none text-sm min-w-[120px]"
          placeholder={selected.length === 0 ? placeholder : undefined}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            if (!open) setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
        />
      </div>

      {open && filteredOptions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 max-h-60 overflow-auto rounded-md border bg-popover shadow-md">
          <ul className="py-1">
            {filteredOptions.map((option) => (
              <li
                key={option.value}
                className="px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
                onClick={() => {
                  onChange([...selected, option.value])
                  setInputValue("")
                }}
              >
                {option.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

