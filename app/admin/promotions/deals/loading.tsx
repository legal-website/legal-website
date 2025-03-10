import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export default function DealsLoading() {
  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Page Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="mt-4 md:mt-0">
          <Skeleton className="h-10 w-36" />
        </div>
      </div>

      {/* Performance Overview Skeleton */}
      <Card className="mb-6">
        <div className="p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                {i > 0 && <Skeleton className="h-2 w-full mt-2" />}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Filters and Search Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Skeleton className="h-10 w-full" />
        <div className="flex space-x-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex items-center justify-end space-x-2">
          <Skeleton className="h-10 w-full" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="mb-6">
        <Skeleton className="h-10 w-full max-w-md" />
      </div>

      {/* Deals List Skeleton */}
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div className="mb-4 md:mb-0 flex items-center">
                <Skeleton className="h-12 w-12 rounded mr-3" />
                <div>
                  <Skeleton className="h-5 w-48 mb-2" />
                  <Skeleton className="h-4 w-72" />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-24" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-6 gap-4">
              {[...Array(6)].map((_, j) => (
                <div key={j}>
                  <Skeleton className="h-3 w-20 mb-2" />
                  <Skeleton className="h-5 w-full" />
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

