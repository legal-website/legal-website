import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { FileText, Search, Lock, Unlock, Gift } from "lucide-react"

export default function Loading() {
  return (
    <div className="p-4 sm:p-6 md:p-8 mb-20 sm:mb-24 md:mb-32 lg:mb-40 max-w-full overflow-hidden">
      <div className="flex items-center mb-4 sm:mb-6">
        <Skeleton className="h-8 w-48 sm:w-64" />
      </div>

      <Card className="mb-6 sm:mb-8 overflow-hidden">
        <div className="p-4 sm:p-6 border-b">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col min-w-0">
              <Skeleton className="h-7 w-40 mb-4" />

              {/* Animated unlocking notification skeleton */}
              <div className="mt-2 bg-green-50 border border-green-100 rounded-md p-3 max-w-full sm:max-w-md animate-pulse">
                <div className="flex items-center mb-2">
                  <div className="h-4 w-4 rounded-full bg-green-200 mr-2"></div>
                  <Skeleton className="h-4 w-48" />
                </div>
                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full w-3/4 animate-[pulse_2s_ease-in-out_infinite]"></div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 flex-wrap">
              <Skeleton className="h-9 w-24 sm:w-32" />

              <div className="flex flex-col xs:flex-row w-full sm:w-auto gap-2 sm:gap-4">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-8 w-24 flex-1" />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Skeleton className="h-5 w-14" />
                  <Skeleton className="h-8 w-24 flex-1" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Template Tabs Skeleton */}
        <div className="px-4 sm:px-6 pt-4 sm:pt-6">
          <Tabs defaultValue="all" className="w-full overflow-x-auto">
            <TabsList className="mb-4 flex flex-wrap gap-1 sm:gap-0">
              <TabsTrigger
                value="all"
                className="flex items-center gap-2 text-xs sm:text-sm whitespace-nowrap"
                disabled
              >
                <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                All Templates
                <Badge variant="secondary" className="ml-1 text-xs">
                  ...
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="free"
                className="flex items-center gap-2 text-xs sm:text-sm whitespace-nowrap"
                disabled
              >
                <Gift className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                Free Templates
                <Badge variant="secondary" className="ml-1 text-xs">
                  ...
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="unlocked"
                className="flex items-center gap-2 text-xs sm:text-sm whitespace-nowrap"
                disabled
              >
                <Unlock className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                Unlocked Templates
                <Badge variant="secondary" className="ml-1 text-xs">
                  ...
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="locked"
                className="flex items-center gap-2 text-xs sm:text-sm whitespace-nowrap"
                disabled
              >
                <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                Locked Templates
                <Badge variant="secondary" className="ml-1 text-xs">
                  ...
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-0">
              {/* Search and filters skeleton */}
              <div className="border-b pb-4 sm:pb-6 mb-4 sm:mb-6">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400">
                        <Search className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <Skeleton className="h-10 w-full pl-9" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-32" />
                </div>
              </div>

              {/* Template Grid Skeleton */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden flex flex-col h-full">
                    <div className="p-4 sm:p-6 flex flex-col h-full">
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <Skeleton className="h-6 w-16" />
                      </div>
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-1" />
                      <Skeleton className="h-4 w-5/6 mb-4" />

                      <div className="flex items-center justify-between mb-3 mt-auto">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-5 w-12" />
                      </div>

                      <div className="flex justify-end">
                        <Skeleton className="h-9 w-full sm:w-32" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Card>

      {/* Pagination Skeleton */}
      <div className="flex justify-center mt-8 mb-12">
        <div className="flex flex-wrap justify-center gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-10" />
          <Skeleton className="h-9 w-10" />
          <Skeleton className="h-9 w-10" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>

      {/* Benefits Section Skeleton */}
      <Card className="mb-8 sm:mb-12">
        <div className="p-4 sm:p-6 border-b">
          <Skeleton className="h-7 w-40" />
        </div>
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="p-2 bg-gray-100 rounded-lg inline-block mb-3">
                  <Skeleton className="h-5 w-5" />
                </div>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Loading animation at the bottom */}
      <div className="flex justify-center items-center gap-2 text-sm text-muted-foreground">
        <div className="h-5 w-5 rounded-full border-2 border-t-transparent border-blue-500 animate-spin"></div>
        <span>Loading document templates...</span>
      </div>
    </div>
  )
}

