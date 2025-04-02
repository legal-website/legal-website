import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export default function BeneficialOwnershipLoading() {
  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 mb-20 sm:mb-24 md:mb-40 overflow-hidden">
      {/* Progress bar at the top */}
      <div className="fixed top-0 left-0 right-0 h-1 z-50">
        <div className="h-full bg-primary animate-pulse"></div>
      </div>

      {/* Owners Card */}
      <Card className="overflow-hidden">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-xl sm:text-2xl">
                <Skeleton className="h-7 w-48" />
              </CardTitle>
              <CardDescription className="text-sm sm:text-base mt-2">
                <Skeleton className="h-4 w-72" />
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Skeleton className="h-10 w-full sm:w-[180px] md:w-[200px]" />
              <Skeleton className="h-10 w-10 flex-shrink-0" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="flex justify-end mb-4">
            <Skeleton className="h-10 w-full sm:w-32" />
          </div>

          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle px-4 sm:px-0">
              {/* Table Header */}
              <div className="border-b pb-3">
                <div className="grid grid-cols-5 gap-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-5 w-full" />
                  ))}
                </div>
              </div>

              {/* Table Rows */}
              <div className="divide-y">
                {[...Array(4)].map((_, rowIndex) => (
                  <div key={rowIndex} className="py-4">
                    <div className="grid grid-cols-5 gap-4">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-24" />
                        {rowIndex === 0 && <Skeleton className="h-5 w-16" />}
                      </div>
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-5 w-12" />
                      <Skeleton className="h-6 w-20" />
                      <div className="flex space-x-2">
                        <Skeleton className="h-8 w-8" />
                        {rowIndex !== 0 && <Skeleton className="h-8 w-8" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between p-4 sm:p-6 flex-wrap">
          <Skeleton className="h-4 w-full sm:w-3/4" />
        </CardFooter>
      </Card>

      {/* Filing History Card */}
      <Card className="overflow-hidden">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-xl sm:text-2xl">
            <Skeleton className="h-7 w-36" />
          </CardTitle>
          <CardDescription className="text-sm sm:text-base mt-2">
            <Skeleton className="h-4 w-64" />
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border rounded-lg p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
                  <div>
                    <Skeleton className="h-5 w-48 sm:w-64 mb-2" />
                    <Skeleton className="h-4 w-36 sm:w-48" />
                  </div>
                  <Skeleton className="h-6 w-20 self-start sm:self-center mt-2 sm:mt-0" />
                </div>
                {i === 0 && (
                  <div className="mt-3 flex justify-end">
                    <Skeleton className="h-8 w-28 sm:w-32" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Loading Indicator */}
      <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg flex items-center space-x-2 animate-bounce">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm font-medium">Loading data...</span>
      </div>
    </div>
  )
}

