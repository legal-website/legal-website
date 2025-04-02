import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="p-4 sm:p-6 md:p-8 mb-20 md:mb-40 overflow-x-hidden">
      <Skeleton className="h-8 sm:h-10 w-32 sm:w-48 mb-4 sm:mb-6" />

      <Card className="mb-6 sm:mb-8 overflow-hidden">
        <div className="p-4 sm:p-6 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <Skeleton className="h-7 sm:h-8 w-28 sm:w-36" />
            <Skeleton className="h-9 sm:h-10 w-36 sm:w-48" />
          </div>
        </div>

        <div className="p-4 sm:p-6 border-b">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full sm:w-40" />
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <Skeleton className="h-10 w-full max-w-md mb-4 sm:mb-6" />

          <div className="space-y-3 sm:space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 sm:h-20 w-full" />
            ))}
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="p-4 sm:p-6 border-b">
          <Skeleton className="h-7 sm:h-8 w-36 sm:w-48" />
        </div>
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-36 sm:h-48 w-full" />
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}

