import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PenTool } from "lucide-react"

export default function AmendmentsLoading() {
  return (
    <div className="p-4 sm:p-6 md:p-8 mb-20 sm:mb-32 md:mb-44 max-w-full overflow-hidden">
      <Skeleton className="h-8 sm:h-10 w-48 sm:w-64 mb-4 sm:mb-6" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
        {/* Submit Amendment Card */}
        <Card className="p-4 sm:p-6 overflow-hidden">
          <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
              <PenTool className="h-5 w-5 sm:h-6 sm:w-6 text-[#22c984]" />
            </div>
            <div className="min-w-0 flex-1">
              <Skeleton className="h-6 sm:h-7 w-40 sm:w-48 mb-2" />
              <Skeleton className="h-4 sm:h-5 w-56 sm:w-64" />
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div>
              <Skeleton className="h-4 sm:h-5 w-32 mb-2" />
              <Skeleton className="h-9 sm:h-10 w-full rounded-md" />
            </div>
            <div>
              <Skeleton className="h-4 sm:h-5 w-36 mb-2" />
              <Skeleton className="h-24 sm:h-28 w-full rounded-md" />
            </div>
            <div>
              <Skeleton className="h-4 sm:h-5 w-48 mb-2" />
              <Skeleton className="h-9 sm:h-10 w-full rounded-md" />
            </div>
            <Skeleton className="h-9 sm:h-10 w-full rounded-md" />
          </div>
        </Card>

        <div className="space-y-4 sm:space-y-6">
          {/* Status of My Amendments */}
          <Card className="p-4 sm:p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <Skeleton className="h-6 sm:h-7 w-40 sm:w-48" />
              <Skeleton className="h-8 w-20 sm:w-24 rounded-md" />
            </div>
            <div className="space-y-3 sm:space-y-4">
              {/* Amendment Items */}
              {[1, 2, 3].map((i) => (
                <div key={i} className="border rounded-lg p-3 sm:p-4">
                  <div className="flex items-start justify-between mb-2 sm:mb-3">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1">
                      <Skeleton className="h-5 w-5 rounded-full flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <Skeleton className="h-5 w-32 sm:w-40 mb-1" />
                        <Skeleton className="h-3 w-24 sm:w-28" />
                      </div>
                    </div>
                    <Skeleton className="h-5 w-20 sm:w-24 rounded-full" />
                  </div>
                  <Skeleton className="h-12 w-full mb-2 sm:mb-3" />

                  {/* Random status sections */}
                  {i === 2 && (
                    <div className="mt-2 sm:mt-3">
                      <Skeleton className="h-20 sm:h-24 w-full rounded-lg" />
                    </div>
                  )}

                  {i === 1 && <Skeleton className="h-8 sm:h-9 w-full rounded-md mt-2 sm:mt-3" />}
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Closed Amendments */}
          <Card className="p-4 sm:p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <Skeleton className="h-6 sm:h-7 w-44 sm:w-52" />
            </div>
            <div className="space-y-3 sm:space-y-4">
              {[1, 2].map((i) => (
                <div key={`closed-${i}`} className="border rounded-lg p-3 sm:p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1">
                      <Skeleton className="h-5 w-5 rounded-full flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <Skeleton className="h-5 w-32 sm:w-40 mb-1" />
                        <Skeleton className="h-3 w-24 sm:w-28" />
                      </div>
                    </div>
                    <Skeleton className="h-5 w-20 sm:w-24 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

