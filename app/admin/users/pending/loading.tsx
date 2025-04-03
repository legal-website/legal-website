export default function Loading() {
  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto overflow-x-hidden">
      {/* Header with title and refresh button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded-md mb-2"></div>
          <div className="h-4 w-80 bg-gray-100 dark:bg-gray-800 rounded-md"></div>
        </div>
        <div className="mt-4 sm:mt-0 animate-pulse">
          <div className="h-10 w-32 bg-blue-100 dark:bg-blue-900/30 rounded-md"></div>
        </div>
      </div>

      {/* Search and filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row gap-4 mb-4 animate-pulse">
          <div className="h-10 flex-1 bg-gray-100 dark:bg-gray-700 rounded-md"></div>
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="h-10 flex-1 bg-gray-100 dark:bg-gray-700 rounded-md"></div>
            <div className="h-10 flex-1 bg-gray-100 dark:bg-gray-700 rounded-md"></div>
            <div className="h-10 w-24 bg-gray-100 dark:bg-gray-700 rounded-md"></div>
          </div>
        </div>

        {/* Status tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700 rounded-md"></div>
          ))}
        </div>
      </div>

      {/* User cards */}
      <div className="space-y-4 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="p-4 border rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                  <div>
                    <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded-md mb-2"></div>
                    <div className="h-4 w-32 bg-gray-100 dark:bg-gray-800 rounded-md"></div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="h-4 w-full bg-gray-100 dark:bg-gray-800 rounded-md"></div>
                  <div className="h-4 w-full bg-gray-100 dark:bg-gray-800 rounded-md"></div>
                  <div className="h-4 w-full bg-gray-100 dark:bg-gray-800 rounded-md"></div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                <div className="h-9 w-24 bg-blue-100 dark:bg-blue-900/30 rounded-md"></div>
                <div className="h-9 w-24 bg-gray-100 dark:bg-gray-700 rounded-md"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-6 flex justify-center animate-pulse">
        <div className="flex items-center gap-1">
          <div className="h-9 w-9 bg-gray-100 dark:bg-gray-700 rounded-md"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-9 w-9 bg-gray-100 dark:bg-gray-700 rounded-md"></div>
          ))}
          <div className="h-9 w-9 bg-gray-100 dark:bg-gray-700 rounded-md"></div>
        </div>
      </div>

      {/* Loading overlay with spinner */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="flex items-center gap-3 bg-white dark:bg-gray-800 px-4 py-3 rounded-full shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="relative w-5 h-5">
            <div className="absolute top-0 left-0 w-full h-full border-2 border-blue-200 dark:border-blue-900 rounded-full"></div>
            <div className="absolute top-0 left-0 w-full h-full border-2 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Loading pending users...</p>
        </div>
      </div>
    </div>
  )
}

