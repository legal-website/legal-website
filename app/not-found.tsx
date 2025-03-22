"use client"

import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

// Create a client component that uses useSearchParams
function NotFoundContent() {
  // If you're using useSearchParams, it should be here
  // const searchParams = useSearchParams()

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-lg mb-8">The page you are looking for does not exist or has been moved.</p>
      <Button asChild>
        <Link href="/">Return to Home</Link>
      </Button>
    </div>
  )
}

// Main component that wraps the client component in Suspense
export default function NotFound() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]">Loading...</div>}>
      <NotFoundContent />
    </Suspense>
  )
}

