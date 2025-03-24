export default function CouponsLoading() {
  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl">
      <div className="flex flex-col items-center justify-center py-12">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-gray-200 rounded-full"></div>
          <div className="w-20 h-20 border-4 border-t-green-500 animate-spin rounded-full absolute top-0 left-0"></div>
        </div>
        <div className="mt-4 flex flex-col items-center">
          <div className="h-2 w-24 bg-gray-200 rounded animate-pulse mb-2.5"></div>
          <div className="h-2 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-6"></div>
              <div className="flex justify-between mb-4">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              </div>
              <div className="flex gap-2 mt-4">
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

