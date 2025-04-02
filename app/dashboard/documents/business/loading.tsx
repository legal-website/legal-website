import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { FileText, Clock, HardDrive, Tag } from "lucide-react"

export default function BusinessDocumentsLoading() {
  return (
    <div className="p-4 sm:p-6 md:p-8 mb-20 md:mb-40">
      <Skeleton className="h-10 w-48 mb-6" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
        <div className="md:col-span-2">
          <Card className="mb-6">
            <div className="p-4 sm:p-6 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <Skeleton className="h-7 w-40" />
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-24" />
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 border-b">
              <div className="flex flex-col sm:flex-row gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full sm:w-[180px]" />
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <div className="flex flex-col items-center justify-center py-8 sm:py-12">
                <div className="relative w-16 h-16 sm:w-24 sm:h-24 mb-4">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 animate-pulse" />
                  </div>
                </div>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-36" />
              </div>
            </div>
          </Card>
        </div>

        <div>
          <Card className="mb-6">
            <div className="p-4 sm:p-6 border-b">
              <Skeleton className="h-6 w-32" />
            </div>
            <div className="p-4 sm:p-6">
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="p-2 bg-gray-100 rounded-full flex-shrink-0">
                      <Clock className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="w-full">
                      <Skeleton className="h-4 w-full mb-1" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="mb-6">
            <div className="p-4 sm:p-6 border-b">
              <Skeleton className="h-6 w-40" />
            </div>
            <div className="p-4 sm:p-6">
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full flex-shrink-0">
                      <HardDrive className="h-4 w-4 text-blue-400" />
                    </div>
                    <Skeleton className="h-4 w-28" />
                  </div>
                  <Skeleton className="h-4 w-6" />
                </div>

                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-200 rounded-full flex-shrink-0">
                        <Tag className="h-4 w-4 text-gray-400" />
                      </div>
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-4 w-6" />
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

