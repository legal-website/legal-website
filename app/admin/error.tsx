"use client"

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  // Safely access error properties
  const errorMessage = error && typeof error === "object" ? error.message : "An unexpected error occurred"

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Error</h1>
      <p className="mb-4">Something went wrong: {errorMessage}</p>
      <button
        onClick={() => {
          // Safely call reset
          if (typeof reset === "function") {
            reset()
          } else {
            window.location.reload()
          }
        }}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Try again
      </button>
    </div>
  )
}

