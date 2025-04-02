"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Moon, Sun, Eye } from "lucide-react"
import { useTheme } from "@/context/theme-context"
import { useToast } from "@/hooks/use-toast"
import { updateAppearanceSettings, getUserSettings } from "@/lib/actions/settings-actions"

export default function SettingsPage() {
  const { theme, setTheme, layoutDensity, setLayoutDensity } = useTheme()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load user settings and login sessions
  useEffect(() => {
    const loadUserData = async () => {
      // Load user settings
      const settings = await getUserSettings()
      if (settings) {
        setTheme((settings.theme as any) || "light")
        setLayoutDensity((settings.layoutDensity as any) || "comfortable")
      }
    }

    loadUserData()
  }, [setTheme, setLayoutDensity])

  // Helper function to get theme-specific classes
  const getThemeClasses = (lightClass = "", darkClass = "", comfortClass = "") => {
    if (theme === "dark") return darkClass
    if (theme === "comfort") return comfortClass
    return lightClass // default to light theme
  }

  // Handle appearance settings form submission
  const handleAppearanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("theme", theme)
      formData.append("layoutDensity", layoutDensity)

      const result = await updateAppearanceSettings(formData)

      if (result.success) {
        toast({
          title: "Settings updated",
          description: result.message,
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 mb-20 md:mb-40 w-full overflow-x-hidden">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Appearance Settings</h1>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1">
          <Card
            className={`w-full ${getThemeClasses(
              "",
              "bg-gray-800 border-gray-700 text-white",
              "bg-[#f8f4e3] border-[#e8e4d3] text-[#5c4f3a]",
            )}`}
          >
            <div className={`p-6 border-b ${getThemeClasses("", "border-gray-700", "border-[#e8e4d3]")}`}>
              <h2 className="text-lg sm:text-xl font-semibold">Appearance</h2>
              <p className={`text-sm ${getThemeClasses("text-gray-500", "text-gray-400", "text-[#7c6f5a]")}`}>
                Customize how your dashboard looks
              </p>
            </div>
            <form onSubmit={handleAppearanceSubmit} className="p-6 space-y-6">
              {/* Theme Selection */}
              <div>
                <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">Theme</h3>
                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div
                    className={`border rounded-lg p-2 sm:p-4 cursor-pointer flex flex-col items-center gap-2 ${theme === "light" ? `border-primary ${getThemeClasses("bg-gray-50", "bg-gray-700", "bg-[#efe9d8]")}` : getThemeClasses("border-gray-200", "border-gray-700", "border-[#e8e4d3]")}`}
                    onClick={() => setTheme("light")}
                  >
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white border rounded-md flex items-center justify-center">
                      <Sun className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500" />
                    </div>
                    <span className="font-medium text-sm sm:text-base">Light</span>
                  </div>

                  <div
                    className={`border rounded-lg p-2 sm:p-4 cursor-pointer flex flex-col items-center gap-2 ${theme === "dark" ? `border-primary ${getThemeClasses("bg-gray-50", "bg-gray-700", "bg-[#efe9d8]")}` : getThemeClasses("border-gray-200", "border-gray-700", "border-[#e8e4d3]")}`}
                    onClick={() => setTheme("dark")}
                  >
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-900 border rounded-md flex items-center justify-center">
                      <Moon className="h-6 w-6 sm:h-8 sm:w-8 text-gray-100" />
                    </div>
                    <span className="font-medium text-sm sm:text-base">Dark</span>
                  </div>

                  <div
                    className={`border rounded-lg p-2 sm:p-4 cursor-pointer flex flex-col items-center gap-2 ${theme === "comfort" ? `border-primary ${getThemeClasses("bg-gray-50", "bg-gray-700", "bg-[#efe9d8]")}` : getThemeClasses("border-gray-200", "border-gray-700", "border-[#e8e4d3]")}`}
                    onClick={() => setTheme("comfort")}
                  >
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#f8f4e3] border rounded-md flex items-center justify-center">
                      <Eye className="h-6 w-6 sm:h-8 sm:w-8 text-[#5c4f3a]" />
                    </div>
                    <span className="font-medium text-sm sm:text-base">Eye Comfort</span>
                  </div>
                </div>
              </div>

              {/* Layout Density */}
              <div>
                <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">Layout Density</h3>
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
                  <div
                    className={`border rounded-lg p-2 sm:p-4 cursor-pointer flex flex-col items-center gap-2 ${layoutDensity === "comfortable" ? `border-primary ${getThemeClasses("bg-gray-50", "bg-gray-700", "bg-[#efe9d8]")}` : getThemeClasses("border-gray-200", "border-gray-700", "border-[#e8e4d3]")}`}
                    onClick={() => setLayoutDensity("comfortable")}
                  >
                    <div
                      className={`w-12 h-12 sm:w-16 sm:h-16 border rounded-md flex flex-col justify-center p-2 ${getThemeClasses("", "border-gray-700 bg-gray-800", "border-[#e8e4d3] bg-[#f8f4e3]")}`}
                    >
                      <div
                        className={`h-2 ${getThemeClasses("bg-gray-300", "bg-gray-600", "bg-[#d8d4c3]")} rounded mb-1`}
                      ></div>
                      <div
                        className={`h-2 ${getThemeClasses("bg-gray-300", "bg-gray-600", "bg-[#d8d4c3]")} rounded mb-1`}
                      ></div>
                      <div
                        className={`h-2 ${getThemeClasses("bg-gray-300", "bg-gray-600", "bg-[#d8d4c3]")} rounded`}
                      ></div>
                    </div>
                    <span className="font-medium text-sm sm:text-base">Comfortable</span>
                  </div>

                  <div
                    className={`border rounded-lg p-2 sm:p-4 cursor-pointer flex flex-col items-center gap-2 ${layoutDensity === "compact" ? `border-primary ${getThemeClasses("bg-gray-50", "bg-gray-700", "bg-[#efe9d8]")}` : getThemeClasses("border-gray-200", "border-gray-700", "border-[#e8e4d3]")}`}
                    onClick={() => setLayoutDensity("compact")}
                  >
                    <div
                      className={`w-12 h-12 sm:w-16 sm:h-16 border rounded-md flex flex-col justify-center p-2 ${getThemeClasses("", "border-gray-700 bg-gray-800", "border-[#e8e4d3] bg-[#f8f4e3]")}`}
                    >
                      <div
                        className={`h-1.5 ${getThemeClasses("bg-gray-300", "bg-gray-600", "bg-[#d8d4c3]")} rounded mb-0.5`}
                      ></div>
                      <div
                        className={`h-1.5 ${getThemeClasses("bg-gray-300", "bg-gray-600", "bg-[#d8d4c3]")} rounded mb-0.5`}
                      ></div>
                      <div
                        className={`h-1.5 ${getThemeClasses("bg-gray-300", "bg-gray-600", "bg-[#d8d4c3]")} rounded mb-0.5`}
                      ></div>
                      <div
                        className={`h-1.5 ${getThemeClasses("bg-gray-300", "bg-gray-600", "bg-[#d8d4c3]")} rounded`}
                      ></div>
                    </div>
                    <span className="font-medium text-sm sm:text-base">Compact</span>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white"
              >
                {isSubmitting ? "Saving..." : "Save Appearance Settings"}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}

