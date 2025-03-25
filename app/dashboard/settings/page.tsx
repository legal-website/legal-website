"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Palette, Moon, Sun, Lock, Eye, Check, Key } from "lucide-react"
import { useTheme } from "@/context/theme-context"
import { useToast } from "@/hooks/use-toast"
import {
  updateAppearanceSettings,
  updatePassword,
  toggleLoginNotifications,
  getUserSettings,
  getUserLoginSessions,
} from "@/lib/actions/settings-actions"

export default function SettingsPage() {
  const { theme, setTheme, layoutDensity, setLayoutDensity } = useTheme()
  const { toast } = useToast()
  const [loginNotificationsEnabled, setLoginNotificationsEnabled] = useState(false)
  const [loginSessions, setLoginSessions] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false)
  const [currentSession, setCurrentSession] = useState<string | null>(null)

  // Load user settings and login sessions
  useEffect(() => {
    const loadUserData = async () => {
      // Load user settings
      const settings = await getUserSettings()
      if (settings) {
        setTheme((settings.theme as any) || "light")
        setLayoutDensity((settings.layoutDensity as any) || "comfortable")
        setLoginNotificationsEnabled(settings.loginNotificationsEnabled || false)
      }

      // Load login sessions
      const sessions = await getUserLoginSessions()
      setLoginSessions(sessions)

      // Set current session
      // This is a simplified approach - in a real app, you'd use a session ID
      setCurrentSession(window.navigator.userAgent)
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

  // Handle password change form submission
  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPasswordSubmitting(true)

    try {
      const formData = new FormData(e.currentTarget)
      const result = await updatePassword(formData)

      if (result.success) {
        toast({
          title: "Password updated",
          description: result.message,
        })
        // Reset form
        e.currentTarget.reset()
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
      setIsPasswordSubmitting(false)
    }
  }

  // Handle login notifications toggle
  const handleLoginNotificationsToggle = async () => {
    const newValue = !loginNotificationsEnabled
    setLoginNotificationsEnabled(newValue)

    try {
      const result = await toggleLoginNotifications(newValue)

      if (result.success) {
        toast({
          title: "Settings updated",
          description: result.message,
        })
      } else {
        // Revert state if failed
        setLoginNotificationsEnabled(!newValue)
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      // Revert state if failed
      setLoginNotificationsEnabled(!newValue)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  // Format date for display
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date)
  }

  // Check if a session is the current one
  const isCurrentSession = (userAgent: string) => {
    return userAgent === currentSession
  }

  return (
    <div className="p-8 mb-40">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <Tabs defaultValue="appearance">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-64">
            <Card
              className={`p-4 ${getThemeClasses("", "bg-gray-800 border-gray-700", "bg-[#f8f4e3] border-[#e8e4d3]")}`}
            >
              <TabsList className="flex flex-col w-full h-auto gap-2 bg-transparent">
                <TabsTrigger
                  value="appearance"
                  className={`w-full justify-start ${getThemeClasses("", "data-[state=active]:bg-gray-700 text-white", "data-[state=active]:bg-[#efe9d8] text-[#5c4f3a]")}`}
                >
                  <Palette className="h-4 w-4 mr-2" />
                  Appearance
                </TabsTrigger>
                <TabsTrigger
                  value="security"
                  className={`w-full justify-start ${getThemeClasses("", "data-[state=active]:bg-gray-700 text-white", "data-[state=active]:bg-[#efe9d8] text-[#5c4f3a]")}`}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Security
                </TabsTrigger>
              </TabsList>
            </Card>
          </div>

          <div className="flex-1">
            <Card
              className={getThemeClasses(
                "",
                "bg-gray-800 border-gray-700 text-white",
                "bg-[#f8f4e3] border-[#e8e4d3] text-[#5c4f3a]",
              )}
            >
              <TabsContent value="appearance" className="m-0">
                <div className={`p-6 border-b ${getThemeClasses("", "border-gray-700", "border-[#e8e4d3]")}`}>
                  <h2 className="text-xl font-semibold">Appearance</h2>
                  <p className={`text-sm ${getThemeClasses("text-gray-500", "text-gray-400", "text-[#7c6f5a]")}`}>
                    Customize how your dashboard looks
                  </p>
                </div>
                <form onSubmit={handleAppearanceSubmit} className="p-6 space-y-6">
                  {/* Theme Selection */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Theme</h3>
                    <div className="flex flex-wrap gap-4">
                      <div
                        className={`border rounded-lg p-4 cursor-pointer flex flex-col items-center gap-2 ${theme === "light" ? `border-primary ${getThemeClasses("bg-gray-50", "bg-gray-700", "bg-[#efe9d8]")}` : getThemeClasses("border-gray-200", "border-gray-700", "border-[#e8e4d3]")}`}
                        onClick={() => setTheme("light")}
                      >
                        <div className="w-16 h-16 bg-white border rounded-md flex items-center justify-center">
                          <Sun className="h-8 w-8 text-yellow-500" />
                        </div>
                        <span className="font-medium">Light</span>
                      </div>

                      <div
                        className={`border rounded-lg p-4 cursor-pointer flex flex-col items-center gap-2 ${theme === "dark" ? `border-primary ${getThemeClasses("bg-gray-50", "bg-gray-700", "bg-[#efe9d8]")}` : getThemeClasses("border-gray-200", "border-gray-700", "border-[#e8e4d3]")}`}
                        onClick={() => setTheme("dark")}
                      >
                        <div className="w-16 h-16 bg-gray-900 border rounded-md flex items-center justify-center">
                          <Moon className="h-8 w-8 text-gray-100" />
                        </div>
                        <span className="font-medium">Dark</span>
                      </div>

                      <div
                        className={`border rounded-lg p-4 cursor-pointer flex flex-col items-center gap-2 ${theme === "comfort" ? `border-primary ${getThemeClasses("bg-gray-50", "bg-gray-700", "bg-[#efe9d8]")}` : getThemeClasses("border-gray-200", "border-gray-700", "border-[#e8e4d3]")}`}
                        onClick={() => setTheme("comfort")}
                      >
                        <div className="w-16 h-16 bg-[#f8f4e3] border rounded-md flex items-center justify-center">
                          <Eye className="h-8 w-8 text-[#5c4f3a]" />
                        </div>
                        <span className="font-medium">Eye Comfort</span>
                      </div>
                    </div>
                  </div>

                  {/* Layout Density */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Layout Density</h3>
                    <div className="flex gap-4">
                      <div
                        className={`border rounded-lg p-4 cursor-pointer flex flex-col items-center gap-2 ${layoutDensity === "comfortable" ? `border-primary ${getThemeClasses("bg-gray-50", "bg-gray-700", "bg-[#efe9d8]")}` : getThemeClasses("border-gray-200", "border-gray-700", "border-[#e8e4d3]")}`}
                        onClick={() => setLayoutDensity("comfortable")}
                      >
                        <div
                          className={`w-16 h-16 border rounded-md flex flex-col justify-center p-2 ${getThemeClasses("", "border-gray-700 bg-gray-800", "border-[#e8e4d3] bg-[#f8f4e3]")}`}
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
                        <span className="font-medium">Comfortable</span>
                      </div>

                      <div
                        className={`border rounded-lg p-4 cursor-pointer flex flex-col items-center gap-2 ${layoutDensity === "compact" ? `border-primary ${getThemeClasses("bg-gray-50", "bg-gray-700", "bg-[#efe9d8]")}` : getThemeClasses("border-gray-200", "border-gray-700", "border-[#e8e4d3]")}`}
                        onClick={() => setLayoutDensity("compact")}
                      >
                        <div
                          className={`w-16 h-16 border rounded-md flex flex-col justify-center p-2 ${getThemeClasses("", "border-gray-700 bg-gray-800", "border-[#e8e4d3] bg-[#f8f4e3]")}`}
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
                        <span className="font-medium">Compact</span>
                      </div>
                    </div>
                  </div>

                  <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90 text-white">
                    {isSubmitting ? "Saving..." : "Save Appearance Settings"}
                  </Button>
                </form>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="m-0">
                <div className={`p-6 border-b ${getThemeClasses("", "border-gray-700", "border-[#e8e4d3]")}`}>
                  <h2 className="text-xl font-semibold">Security Settings</h2>
                  <p className={`text-sm ${getThemeClasses("text-gray-500", "text-gray-400", "text-[#7c6f5a]")}`}>
                    Manage your account security
                  </p>
                </div>
                <div className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-4">Change Password</h3>
                      <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <div>
                          <Label htmlFor="currentPassword">Current Password</Label>
                          <Input
                            id="currentPassword"
                            name="currentPassword"
                            type="password"
                            required
                            className={getThemeClasses(
                              "",
                              "bg-gray-700 border-gray-600",
                              "bg-[#f8f4e3] border-[#e8e4d3]",
                            )}
                          />
                        </div>
                        <div>
                          <Label htmlFor="newPassword">New Password</Label>
                          <Input
                            id="newPassword"
                            name="newPassword"
                            type="password"
                            required
                            className={getThemeClasses(
                              "",
                              "bg-gray-700 border-gray-600",
                              "bg-[#f8f4e3] border-[#e8e4d3]",
                            )}
                          />
                        </div>
                        <div>
                          <Label htmlFor="confirmPassword">Confirm New Password</Label>
                          <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            required
                            className={getThemeClasses(
                              "",
                              "bg-gray-700 border-gray-600",
                              "bg-[#f8f4e3] border-[#e8e4d3]",
                            )}
                          />
                        </div>
                        <Button
                          type="submit"
                          disabled={isPasswordSubmitting}
                          className="bg-primary hover:bg-primary/90 text-white"
                        >
                          {isPasswordSubmitting ? "Updating..." : "Update Password"}
                        </Button>
                      </form>
                    </div>

                    <div className={`pt-4 border-t ${getThemeClasses("", "border-gray-700", "border-[#e8e4d3]")}`}>
                      <h3 className="font-medium mb-4">Login Notifications</h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Email Login Notifications</h4>
                          <p
                            className={`text-sm ${getThemeClasses("text-gray-500", "text-gray-400", "text-[#7c6f5a]")}`}
                          >
                            Receive email notifications when someone logs into your account
                          </p>
                        </div>
                        <Switch checked={loginNotificationsEnabled} onCheckedChange={handleLoginNotificationsToggle} />
                      </div>
                    </div>

                    <div className={`pt-4 border-t ${getThemeClasses("", "border-gray-700", "border-[#e8e4d3]")}`}>
                      <h3 className="font-medium mb-4">Login Sessions</h3>
                      <div className="space-y-4">
                        {loginSessions.length > 0 ? (
                          loginSessions.map((session, index) => (
                            <div key={index} className="p-4 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center">
                                  <div
                                    className={`p-2 rounded-full ${
                                      isCurrentSession(session.userAgent)
                                        ? getThemeClasses("bg-green-100", "bg-green-900", "bg-green-100")
                                        : getThemeClasses("bg-gray-100", "bg-gray-800", "bg-[#e8e4d3]")
                                    }`}
                                  >
                                    {isCurrentSession(session.userAgent) ? (
                                      <Check
                                        className={`h-4 w-4 ${getThemeClasses("text-green-600", "text-green-400", "text-green-600")}`}
                                      />
                                    ) : (
                                      <Key
                                        className={`h-4 w-4 ${getThemeClasses("text-gray-600", "text-gray-400", "text-[#7c6f5a]")}`}
                                      />
                                    )}
                                  </div>
                                  <span className="ml-2 font-medium">
                                    {isCurrentSession(session.userAgent) ? "Current Session" : "Other Device"}
                                  </span>
                                </div>
                                <span
                                  className={`text-xs px-2 py-1 rounded-full ${
                                    isCurrentSession(session.userAgent)
                                      ? getThemeClasses(
                                          "bg-green-100 text-green-800",
                                          "bg-green-900 text-green-400",
                                          "bg-green-100 text-green-800",
                                        )
                                      : getThemeClasses(
                                          "bg-gray-100 text-gray-800",
                                          "bg-gray-800 text-gray-300",
                                          "bg-[#e8e4d3] text-[#5c4f3a]",
                                        )
                                  }`}
                                >
                                  {isCurrentSession(session.userAgent) ? "Active" : "Inactive"}
                                </span>
                              </div>
                              <div
                                className={`text-sm ${getThemeClasses("text-gray-500", "text-gray-400", "text-[#7c6f5a]")}`}
                              >
                                <p>
                                  {session.browser} on {session.os} • {session.location || "Unknown location"}
                                </p>
                                <p>IP Address: {session.ipAddress || "Unknown"}</p>
                                <p>Last active: {formatDate(session.lastActiveAt)}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center p-4">
                            <p className="text-gray-500">No login sessions found</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Card>
          </div>
        </div>
      </Tabs>
    </div>
  )
}

