"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  // Safely access error properties
  const errorMessage = error && typeof error === "object" ? error.message : "An unexpected error occurred"
  const errorDigest = error && typeof error === "object" && "digest" in error ? error.digest : undefined

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
            <h1 className="text-2xl font-bold mb-4">Something went wrong!</h1>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            {errorDigest && <p className="text-sm text-gray-500 mb-4">Error ID: {errorDigest}</p>}
            <button
              onClick={() => {
                // Safely call reset
                if (typeof reset === "function") {
                  reset()
                } else {
                  window.location.reload()
                }
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}

