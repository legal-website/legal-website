"use client"

import { useState, useEffect, useRef } from "react"
import type { SearchResult } from "@/actions/search"
import { File, TicketIcon, Users, FileText, User, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useOnClickOutside } from "@/hooks/use-on-click-outside"

interface SearchResultsProps {
  results: SearchResult[]
  isLoading: boolean
  onClose: () => void
}

export function SearchResults({ results, isLoading, onClose }: SearchResultsProps) {
  const router = useRouter()
  // Fix the ref type to be explicitly HTMLDivElement
  const resultsRef = useRef<HTMLDivElement>(null)

  // Close results when clicking outside
  useOnClickOutside(resultsRef, onClose)

  // Handle keyboard navigation
  const [selectedIndex, setSelectedIndex] = useState<number>(-1)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!results.length) return

      // Arrow down
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev))
      }

      // Arrow up
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev))
      }

      // Enter to navigate
      if (e.key === "Enter" && selectedIndex >= 0) {
        e.preventDefault()
        router.push(results[selectedIndex].url)
        onClose()
      }

      // Escape to close
      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [results, selectedIndex, router, onClose])

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(-1)
  }, [results])

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "File":
        return <File className="h-4 w-4 text-blue-500" />
      case "TicketIcon":
        return <TicketIcon className="h-4 w-4 text-amber-500" />
      case "Users":
        return <Users className="h-4 w-4 text-green-500" />
      case "FileText":
        return <FileText className="h-4 w-4 text-purple-500" />
      case "User":
        return <User className="h-4 w-4 text-slate-500" />
      default:
        return <File className="h-4 w-4" />
    }
  }

  if (!isLoading && results.length === 0) {
    return (
      <div
        ref={resultsRef}
        className="absolute top-full mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 z-50 max-h-96 overflow-auto"
      >
        <div className="p-4 text-center text-gray-500">No results found</div>
      </div>
    )
  }

  return (
    <div
      ref={resultsRef}
      className="absolute top-full mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 z-50 max-h-96 overflow-auto"
    >
      {isLoading ? (
        <div className="flex items-center justify-center p-6">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#22c984]" />
            <span className="mt-2 text-gray-600 font-medium">Searching...</span>
          </div>
        </div>
      ) : (
        <div className="py-2">
          {results.length > 0 ? (
            results.map((result, index) => (
              <Link
                href={result.url}
                key={`${result.type}-${result.id}`}
                onClick={onClose}
                className={`block px-4 py-2 hover:bg-gray-100 ${selectedIndex === index ? "bg-gray-100" : ""}`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">{getIcon(result.icon)}</div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{result.title}</p>
                    <p className="text-xs text-gray-500 truncate">{result.description}</p>
                    <p className="text-xs text-gray-400 mt-1 capitalize">{result.type}</p>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">No results found</div>
          )}
        </div>
      )}
    </div>
  )
}

