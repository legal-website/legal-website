export default function Loading() {
  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="mt-4 md:mt-0 animate-pulse">
          <div className="h-9 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6 animate-pulse">
        <div className="h-10 w-full md:w-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <div className="h-10 w-full md:w-44 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="flex gap-2 w-full">
            <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>

      <div className="mb-6 animate-pulse">
        <div className="h-10 w-full max-w-md bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
      </div>

      <div className="space-y-4 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-4 border rounded-lg border-gray-200 dark:border-gray-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div className="mb-4 md:mb-0">
                <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 w-60 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-3 w-80 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
              <div>
                <div className="h-9 w-28 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
        <div className="flex flex-col items-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <div className="relative w-16 h-16 mb-3">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-200 dark:border-blue-900 rounded-full"></div>
            <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Loading LLC data...</p>
        </div>
      </div>
    </div>
  )
}

