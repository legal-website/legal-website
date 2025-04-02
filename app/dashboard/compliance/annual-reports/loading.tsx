import { CalendarIcon, FileText, RefreshCw } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export default function AnnualReportsLoading() {
  return (
    <div className="p-4 md:p-6 lg:p-8 mb-20 md:mb-40 overflow-hidden">
      <div className="fixed top-0 left-0 right-0 h-1 z-50">
        <div className="h-full bg-primary animate-pulse"></div>
      </div>

      <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Annual Reports</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 lg:gap-8">
        <div className="space-y-4 md:space-y-6">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 md:p-6">
              <div className="flex items-start gap-3 md:gap-4 mb-3 md:mb-4">
                <div className="p-2 bg-white rounded-lg shadow-sm flex-shrink-0">
                  <CalendarIcon className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-semibold mb-0.5 md:mb-1">Annual Report Calendar</h3>
                  <p className="text-sm md:text-base text-gray-600">Track your filing deadlines</p>
                </div>
              </div>
            </div>

            <div className="p-3 md:p-4 lg:p-6">
              <div className="max-w-full overflow-x-auto pb-2">
                <Skeleton className="h-[300px] w-full rounded-md" />
              </div>

              <div className="mt-3 md:mt-4 p-3 md:p-4 bg-blue-50 rounded-lg border border-blue-100">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6 mb-3" />
                <div className="mt-2 md:mt-3 flex flex-wrap items-center justify-between gap-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base md:text-lg font-semibold">Upcoming Deadlines</h3>
              <Button variant="ghost" size="sm" disabled={true} className="relative h-8 w-8 md:h-9 md:w-auto md:px-3">
                <span className="sr-only md:not-sr-only md:mr-2">Refresh</span>
                <RefreshCw className="h-4 w-4 animate-spin" />
              </Button>
            </div>

            <div className="space-y-3 md:space-y-4 max-h-[400px] overflow-y-auto pr-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 md:p-4 border rounded-lg">
                  <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Skeleton className="h-5 w-5 rounded-full" />
                      <Skeleton className="h-5 w-40 sm:w-48" />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Skeleton className="h-5 w-20 rounded-full" />
                      {i % 2 === 0 && <Skeleton className="h-5 w-24 rounded-full" />}
                    </div>
                  </div>
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-5/6 mb-2" />
                  <div className="mt-2">
                    <Skeleton className="h-8 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-4 md:space-y-6">
          <Card className="p-4 md:p-6">
            <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Filing Requirements</h3>
            <div className="space-y-3 md:space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 md:p-4 bg-gray-50 rounded-lg">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-5/6 mb-1" />
                  {i === 1 && (
                    <ul className="pl-4 md:pl-5 space-y-0.5 md:space-y-1 mt-2">
                      <li>
                        <Skeleton className="h-3 w-full" />
                      </li>
                      <li>
                        <Skeleton className="h-3 w-5/6" />
                      </li>
                      <li>
                        <Skeleton className="h-3 w-4/5" />
                      </li>
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4 md:p-6">
            <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Past Filings</h3>
            <div className="space-y-3 md:space-y-4 max-h-[400px] overflow-y-auto pr-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex flex-wrap md:flex-nowrap items-center justify-between p-3 md:p-4 border rounded-lg gap-2 md:gap-3"
                >
                  <div className="flex items-center gap-2 md:gap-3 min-w-0 w-full md:w-auto">
                    <FileText className="h-4 w-4 md:h-5 md:w-5 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <Skeleton className="h-5 w-40 sm:w-48" />
                      <Skeleton className="h-3 w-24 mt-1" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-8 w-16" />
                    {i % 2 === 0 && <Skeleton className="h-5 w-16 rounded-full" />}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

