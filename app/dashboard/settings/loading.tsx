import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Sun, Moon, Eye } from "lucide-react"

export default function SettingsLoading() {
  return (
    <div className="p-4 sm:p-6 md:p-8 mb-20 md:mb-40 w-full overflow-x-hidden">
      <Skeleton className="h-8 sm:h-10 w-48 sm:w-64 mb-4 sm:mb-6" />

      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1">
          <Card className="w-full border bg-card text-card-foreground shadow-sm">
            <div className="p-6 border-b animate-pulse">
              <Skeleton className="h-6 sm:h-7 w-32 sm:w-40 mb-2" />
              <Skeleton className="h-4 w-56 sm:w-64" />
            </div>
            <div className="p-6 space-y-6">
              {/* Theme Selection Loading */}
              <div>
                <Skeleton className="h-6 w-20 mb-4" />
                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  {/* Theme Option 1 - Light */}
                  <div className="border rounded-lg p-2 sm:p-4 flex flex-col items-center gap-2 animate-pulse">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 border rounded-md flex items-center justify-center">
                      <Sun className="h-6 w-6 sm:h-8 sm:w-8 text-gray-300" />
                    </div>
                    <Skeleton className="h-4 w-12" />
                  </div>

                  {/* Theme Option 2 - Dark */}
                  <div className="border rounded-lg p-2 sm:p-4 flex flex-col items-center gap-2 animate-pulse">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 border rounded-md flex items-center justify-center">
                      <Moon className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                    </div>
                    <Skeleton className="h-4 w-12" />
                  </div>

                  {/* Theme Option 3 - Comfort */}
                  <div className="border rounded-lg p-2 sm:p-4 flex flex-col items-center gap-2 animate-pulse">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 border rounded-md flex items-center justify-center">
                      <Eye className="h-6 w-6 sm:h-8 sm:w-8 text-gray-300" />
                    </div>
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </div>

              {/* Layout Density Loading */}
              <div>
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
                  {/* Density Option 1 */}
                  <div className="border rounded-lg p-2 sm:p-4 flex flex-col items-center gap-2 animate-pulse">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 border rounded-md flex flex-col justify-center p-2 bg-gray-100">
                      <div className="h-2 bg-gray-200 rounded mb-1"></div>
                      <div className="h-2 bg-gray-200 rounded mb-1"></div>
                      <div className="h-2 bg-gray-200 rounded"></div>
                    </div>
                    <Skeleton className="h-4 w-24" />
                  </div>

                  {/* Density Option 2 */}
                  <div className="border rounded-lg p-2 sm:p-4 flex flex-col items-center gap-2 animate-pulse">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 border rounded-md flex flex-col justify-center p-2 bg-gray-100">
                      <div className="h-1.5 bg-gray-200 rounded mb-0.5"></div>
                      <div className="h-1.5 bg-gray-200 rounded mb-0.5"></div>
                      <div className="h-1.5 bg-gray-200 rounded mb-0.5"></div>
                      <div className="h-1.5 bg-gray-200 rounded"></div>
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              </div>

              {/* Button Loading */}
              <Skeleton className="h-10 w-full sm:w-64 mt-6" />
            </div>
          </Card>
        </div>
      </div>

      {/* Theme Switching Animation */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-10 z-10">
        <div className="relative w-24 h-24 sm:w-32 sm:h-32">
          <div className="absolute inset-0 flex items-center justify-center animate-ping-slow">
            <Sun className="w-16 h-16 sm:w-20 sm:h-20 text-yellow-500" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center animate-ping-slow animation-delay-500">
            <Moon className="w-16 h-16 sm:w-20 sm:h-20 text-blue-500" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center animate-ping-slow animation-delay-1000">
            <Eye className="w-16 h-16 sm:w-20 sm:h-20 text-emerald-500" />
          </div>
        </div>
      </div>
    </div>
  )
}

