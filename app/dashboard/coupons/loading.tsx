export default function CouponsLoading() {
  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl mb-20 sm:mb-24 md:mb-32 lg:mb-40">
      <div className="flex flex-col items-center justify-center py-12">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-gray-200 rounded-full"></div>
          <div className="w-20 h-20 border-4 border-t-green-500 animate-spin rounded-full absolute top-0 left-0"></div>
        </div>
        <div className="mt-4 flex flex-col items-center">
          <div className="h-2 w-24 bg-gray-200 rounded animate-pulse mb-2.5"></div>
          <div className="h-2 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Search and filter skeleton */}
        <div className="w-full max-w-4xl mt-8 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded flex-1 sm:w-48"></div>
              <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded flex-shrink-0"></div>
            </div>
          </div>
        </div>

        {/* Tabs skeleton */}
        <div className="w-full max-w-4xl mb-6">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded max-w-xs mx-auto"></div>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full max-w-4xl">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-6"></div>
              <div className="flex justify-between mb-4 flex-wrap gap-y-2">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 min-w-[80px]"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 min-w-[80px]"></div>
              </div>
              <div className="flex gap-2 mt-4 flex-wrap sm:flex-nowrap">
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded flex-1 min-w-[100px]"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded flex-1 min-w-[100px]"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination skeleton */}
        <div className="mt-8 w-full max-w-4xl">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded max-w-xs mx-auto"></div>
        </div>
      </div>
    </div>
  )
}

