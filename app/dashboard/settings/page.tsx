"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Moon, Sun, Palette, Globe, Lock, UserCog, Eye, Check, Key, CreditCard } from "lucide-react"
import { useTheme } from "@/context/theme-context"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [accentColor, setAccentColor] = useState("#22c984")
  const [layoutDensity, setLayoutDensity] = useState<"comfortable" | "compact">("comfortable")
  const [language, setLanguage] = useState("english")
  const [notificationSettings, setNotificationSettings] = useState({
    emailUpdates: true,
    orderNotifications: true,
    marketingEmails: false,
    securityAlerts: true,
  })

  const handleAccentColorChange = (color: string) => {
    setAccentColor(color)
    // In a real app, this would update CSS variables
    document.documentElement.style.setProperty("--primary-color", color)
  }

  const handleNotificationToggle = (key: keyof typeof notificationSettings) => {
    setNotificationSettings({
      ...notificationSettings,
      [key]: !notificationSettings[key],
    })
  }

  const colorOptions = [
    { name: "Green", value: "#22c984" },
    { name: "Blue", value: "#0066FF" },
    { name: "Purple", value: "#8A2BE2" },
    { name: "Orange", value: "#FF7F50" },
    { name: "Pink", value: "#FF69B4" },
  ]

  const languageOptions = [
    { name: "English", value: "english", flag: "🇺🇸" },
    { name: "Spanish", value: "spanish", flag: "🇪🇸" },
    { name: "French", value: "french", flag: "🇫🇷" },
    { name: "German", value: "german", flag: "🇩🇪" },
    { name: "Chinese", value: "chinese", flag: "🇨🇳" },
    { name: "Arabic", value: "arabic", flag: "🇦🇪" },
  ]

  // Helper function to get theme-specific classes
  const getThemeClasses = (lightClass = "", darkClass = "", comfortClass = "") => {
    if (theme === "dark") return darkClass
    if (theme === "comfort") return comfortClass
    return lightClass // default to light theme
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
                  value="notifications"
                  className={`w-full justify-start ${getThemeClasses("", "data-[state=active]:bg-gray-700 text-white", "data-[state=active]:bg-[#efe9d8] text-[#5c4f3a]")}`}
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger
                  value="account"
                  className={`w-full justify-start ${getThemeClasses("", "data-[state=active]:bg-gray-700 text-white", "data-[state=active]:bg-[#efe9d8] text-[#5c4f3a]")}`}
                >
                  <UserCog className="h-4 w-4 mr-2" />
                  Account
                </TabsTrigger>
                <TabsTrigger
                  value="security"
                  className={`w-full justify-start ${getThemeClasses("", "data-[state=active]:bg-gray-700 text-white", "data-[state=active]:bg-[#efe9d8] text-[#5c4f3a]")}`}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Security
                </TabsTrigger>
                <TabsTrigger
                  value="language"
                  className={`w-full justify-start ${getThemeClasses("", "data-[state=active]:bg-gray-700 text-white", "data-[state=active]:bg-[#efe9d8] text-[#5c4f3a]")}`}
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Language
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
                <div className="p-6 space-y-6">
                  {/* Theme Selection */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Theme</h3>
                    <div className="flex flex-wrap gap-4">
                      <div
                        className={`border rounded-lg p-4 cursor-pointer flex flex-col items-center gap-2 ${theme === "light" ? `border-[#22c984] ${getThemeClasses("bg-gray-50", "bg-gray-700", "bg-[#efe9d8]")}` : getThemeClasses("border-gray-200", "border-gray-700", "border-[#e8e4d3]")}`}
                        onClick={() => setTheme("light")}
                      >
                        <div className="w-16 h-16 bg-white border rounded-md flex items-center justify-center">
                          <Sun className="h-8 w-8 text-yellow-500" />
                        </div>
                        <span className="font-medium">Light</span>
                      </div>

                      <div
                        className={`border rounded-lg p-4 cursor-pointer flex flex-col items-center gap-2 ${theme === "dark" ? `border-[#22c984] ${getThemeClasses("bg-gray-50", "bg-gray-700", "bg-[#efe9d8]")}` : getThemeClasses("border-gray-200", "border-gray-700", "border-[#e8e4d3]")}`}
                        onClick={() => setTheme("dark")}
                      >
                        <div className="w-16 h-16 bg-gray-900 border rounded-md flex items-center justify-center">
                          <Moon className="h-8 w-8 text-gray-100" />
                        </div>
                        <span className="font-medium">Dark</span>
                      </div>

                      <div
                        className={`border rounded-lg p-4 cursor-pointer flex flex-col items-center gap-2 ${theme === "comfort" ? `border-[#22c984] ${getThemeClasses("bg-gray-50", "bg-gray-700", "bg-[#efe9d8]")}` : getThemeClasses("border-gray-200", "border-gray-700", "border-[#e8e4d3]")}`}
                        onClick={() => setTheme("comfort")}
                      >
                        <div className="w-16 h-16 bg-[#f8f4e3] border rounded-md flex items-center justify-center">
                          <Eye className="h-8 w-8 text-[#5c4f3a]" />
                        </div>
                        <span className="font-medium">Eye Comfort</span>
                      </div>
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Accent Color</h3>
                    <div className="flex flex-wrap gap-3">
                      {colorOptions.map((color) => (
                        <div
                          key={color.value}
                          className={`w-10 h-10 rounded-full cursor-pointer flex items-center justify-center ${accentColor === color.value ? "ring-2 ring-offset-2 ring-gray-400" : ""}`}
                          style={{ backgroundColor: color.value }}
                          onClick={() => handleAccentColorChange(color.value)}
                          title={color.name}
                        >
                          {accentColor === color.value && (
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Layout Density */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Layout Density</h3>
                    <div className="flex gap-4">
                      <div
                        className={`border rounded-lg p-4 cursor-pointer flex flex-col items-center gap-2 ${layoutDensity === "comfortable" ? `border-[#22c984] ${getThemeClasses("bg-gray-50", "bg-gray-700", "bg-[#efe9d8]")}` : getThemeClasses("border-gray-200", "border-gray-700", "border-[#e8e4d3]")}`}
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
                        className={`border rounded-lg p-4 cursor-pointer flex flex-col items-center gap-2 ${layoutDensity === "compact" ? `border-[#22c984] ${getThemeClasses("bg-gray-50", "bg-gray-700", "bg-[#efe9d8]")}` : getThemeClasses("border-gray-200", "border-gray-700", "border-[#e8e4d3]")}`}
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

                  <Button
                    className={getThemeClasses(
                      "bg-[#22c984] hover:bg-[#1eac73] text-white",
                      "bg-[#22c984] hover:bg-[#1eac73] text-white",
                      "bg-[#22c984] hover:bg-[#1eac73] text-white",
                    )}
                  >
                    Save Appearance Settings
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="notifications" className="m-0">
                <div className={`p-6 border-b ${getThemeClasses("", "border-gray-700", "border-[#e8e4d3]")}`}>
                  <h2 className="text-xl font-semibold">Notifications</h2>
                  <p className={`text-sm ${getThemeClasses("text-gray-500", "text-gray-400", "text-[#7c6f5a]")}`}>
                    Manage your notification preferences
                  </p>
                </div>
                <div className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Email Updates</h3>
                        <p className={`text-sm ${getThemeClasses("text-gray-500", "text-gray-400", "text-[#7c6f5a]")}`}>
                          Receive updates about your account via email
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.emailUpdates}
                        onCheckedChange={() => handleNotificationToggle("emailUpdates")}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Order Notifications</h3>
                        <p className={`text-sm ${getThemeClasses("text-gray-500", "text-gray-400", "text-[#7c6f5a]")}`}>
                          Get notified about order status changes
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.orderNotifications}
                        onCheckedChange={() => handleNotificationToggle("orderNotifications")}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Marketing Emails</h3>
                        <p className={`text-sm ${getThemeClasses("text-gray-500", "text-gray-400", "text-[#7c6f5a]")}`}>
                          Receive promotional offers and newsletters
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.marketingEmails}
                        onCheckedChange={() => handleNotificationToggle("marketingEmails")}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Security Alerts</h3>
                        <p className={`text-sm ${getThemeClasses("text-gray-500", "text-gray-400", "text-[#7c6f5a]")}`}>
                          Get notified about important security updates
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.securityAlerts}
                        onCheckedChange={() => handleNotificationToggle("securityAlerts")}
                      />
                    </div>
                  </div>

                  <div className={`pt-4 border-t ${getThemeClasses("", "border-gray-700", "border-[#e8e4d3]")}`}>
                    <h3 className="font-medium mb-4">Email Preferences</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="notification-email">Notification Email</Label>
                        <Input
                          id="notification-email"
                          defaultValue="contact@rapidventures.com"
                          className={getThemeClasses(
                            "",
                            "bg-gray-700 border-gray-600",
                            "bg-[#f8f4e3] border-[#e8e4d3]",
                          )}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch id="digest-mode" />
                        <Label htmlFor="digest-mode">Send daily digest instead of individual emails</Label>
                      </div>
                    </div>
                  </div>

                  <Button
                    className={getThemeClasses(
                      "bg-[#22c984] hover:bg-[#1eac73] text-white",
                      "bg-[#22c984] hover:bg-[#1eac73] text-white",
                      "bg-[#22c984] hover:bg-[#1eac73] text-white",
                    )}
                  >
                    Save Notification Settings
                  </Button>
                </div>
              </TabsContent>

              {/* Account Tab */}
              <TabsContent value="account" className="m-0">
                <div className={`p-6 border-b ${getThemeClasses("", "border-gray-700", "border-[#e8e4d3]")}`}>
                  <h2 className="text-xl font-semibold">Account Settings</h2>
                  <p className={`text-sm ${getThemeClasses("text-gray-500", "text-gray-400", "text-[#7c6f5a]")}`}>
                    Manage your account information
                  </p>
                </div>
                <div className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="account-name">Full Name</Label>
                      <Input
                        id="account-name"
                        defaultValue="John Smith"
                        className={getThemeClasses("", "bg-gray-700 border-gray-600", "bg-[#f8f4e3] border-[#e8e4d3]")}
                      />
                    </div>

                    <div>
                      <Label htmlFor="account-email">Email Address</Label>
                      <Input
                        id="account-email"
                        defaultValue="john@rapidventures.com"
                        className={getThemeClasses("", "bg-gray-700 border-gray-600", "bg-[#f8f4e3] border-[#e8e4d3]")}
                      />
                    </div>

                    <div>
                      <Label htmlFor="account-phone">Phone Number</Label>
                      <Input
                        id="account-phone"
                        defaultValue="(555) 123-4567"
                        className={getThemeClasses("", "bg-gray-700 border-gray-600", "bg-[#f8f4e3] border-[#e8e4d3]")}
                      />
                    </div>
                  </div>

                  <div className={`pt-4 border-t ${getThemeClasses("", "border-gray-700", "border-[#e8e4d3]")}`}>
                    <h3 className="font-medium mb-4">Billing Information</h3>
                    <div className="space-y-4">
                      <div className="flex items-center p-4 border rounded-lg">
                        <CreditCard className="h-5 w-5 mr-3 text-gray-400" />
                        <div>
                          <p className="font-medium">Visa ending in 4242</p>
                          <p
                            className={`text-sm ${getThemeClasses("text-gray-500", "text-gray-400", "text-[#7c6f5a]")}`}
                          >
                            Expires 12/2025
                          </p>
                        </div>
                        <Button variant="outline" size="sm" className="ml-auto">
                          Update
                        </Button>
                      </div>

                      <div>
                        <Label htmlFor="billing-address">Billing Address</Label>
                        <Input
                          id="billing-address"
                          defaultValue="100 Ambition Parkway, New York, NY 10001, USA"
                          className={getThemeClasses(
                            "",
                            "bg-gray-700 border-gray-600",
                            "bg-[#f8f4e3] border-[#e8e4d3]",
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <div className={`pt-4 border-t ${getThemeClasses("", "border-gray-700", "border-[#e8e4d3]")}`}>
                    <h3 className="font-medium mb-4">Account Preferences</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Two-Factor Authentication</h4>
                          <p
                            className={`text-sm ${getThemeClasses("text-gray-500", "text-gray-400", "text-[#7c6f5a]")}`}
                          >
                            Add an extra layer of security to your account
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Enable
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Delete Account</h4>
                          <p
                            className={`text-sm ${getThemeClasses("text-gray-500", "text-gray-400", "text-[#7c6f5a]")}`}
                          >
                            Permanently delete your account and all data
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Button
                    className={getThemeClasses(
                      "bg-[#22c984] hover:bg-[#1eac73] text-white",
                      "bg-[#22c984] hover:bg-[#1eac73] text-white",
                      "bg-[#22c984] hover:bg-[#1eac73] text-white",
                    )}
                  >
                    Save Account Settings
                  </Button>
                </div>
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
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="current-password">Current Password</Label>
                          <Input
                            id="current-password"
                            type="password"
                            className={getThemeClasses(
                              "",
                              "bg-gray-700 border-gray-600",
                              "bg-[#f8f4e3] border-[#e8e4d3]",
                            )}
                          />
                        </div>
                        <div>
                          <Label htmlFor="new-password">New Password</Label>
                          <Input
                            id="new-password"
                            type="password"
                            className={getThemeClasses(
                              "",
                              "bg-gray-700 border-gray-600",
                              "bg-[#f8f4e3] border-[#e8e4d3]",
                            )}
                          />
                        </div>
                        <div>
                          <Label htmlFor="confirm-password">Confirm New Password</Label>
                          <Input
                            id="confirm-password"
                            type="password"
                            className={getThemeClasses(
                              "",
                              "bg-gray-700 border-gray-600",
                              "bg-[#f8f4e3] border-[#e8e4d3]",
                            )}
                          />
                        </div>
                        <Button
                          className={getThemeClasses(
                            "bg-[#22c984] hover:bg-[#1eac73] text-white",
                            "bg-[#22c984] hover:bg-[#1eac73] text-white",
                            "bg-[#22c984] hover:bg-[#1eac73] text-white",
                          )}
                        >
                          Update Password
                        </Button>
                      </div>
                    </div>

                    <div className={`pt-4 border-t ${getThemeClasses("", "border-gray-700", "border-[#e8e4d3]")}`}>
                      <h3 className="font-medium mb-4">Two-Factor Authentication</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">SMS Authentication</h4>
                            <p
                              className={`text-sm ${getThemeClasses("text-gray-500", "text-gray-400", "text-[#7c6f5a]")}`}
                            >
                              Receive a code via SMS when signing in
                            </p>
                          </div>
                          <Switch />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Authenticator App</h4>
                            <p
                              className={`text-sm ${getThemeClasses("text-gray-500", "text-gray-400", "text-[#7c6f5a]")}`}
                            >
                              Use an authenticator app to generate codes
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            Setup
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className={`pt-4 border-t ${getThemeClasses("", "border-gray-700", "border-[#e8e4d3]")}`}>
                      <h3 className="font-medium mb-4">Login Sessions</h3>
                      <div className="space-y-4">
                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <div
                                className={`p-2 rounded-full ${getThemeClasses("bg-green-100", "bg-green-900", "bg-green-100")}`}
                              >
                                <Check
                                  className={`h-4 w-4 ${getThemeClasses("text-green-600", "text-green-400", "text-green-600")}`}
                                />
                              </div>
                              <span className="ml-2 font-medium">Current Session</span>
                            </div>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${getThemeClasses("bg-green-100 text-green-800", "bg-green-900 text-green-400", "bg-green-100 text-green-800")}`}
                            >
                              Active
                            </span>
                          </div>
                          <div
                            className={`text-sm ${getThemeClasses("text-gray-500", "text-gray-400", "text-[#7c6f5a]")}`}
                          >
                            <p>Chrome on Windows • New York, USA</p>
                            <p>Last active: Just now</p>
                          </div>
                        </div>

                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <div
                                className={`p-2 rounded-full ${getThemeClasses("bg-gray-100", "bg-gray-800", "bg-[#e8e4d3]")}`}
                              >
                                <Key
                                  className={`h-4 w-4 ${getThemeClasses("text-gray-600", "text-gray-400", "text-[#7c6f5a]")}`}
                                />
                              </div>
                              <span className="ml-2 font-medium">Mobile App</span>
                            </div>
                            <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600">
                              Logout
                            </Button>
                          </div>
                          <div
                            className={`text-sm ${getThemeClasses("text-gray-500", "text-gray-400", "text-[#7c6f5a]")}`}
                          >
                            <p>iPhone • San Francisco, USA</p>
                            <p>Last active: 2 hours ago</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Language Tab */}
              <TabsContent value="language" className="m-0">
                <div className={`p-6 border-b ${getThemeClasses("", "border-gray-700", "border-[#e8e4d3]")}`}>
                  <h2 className="text-xl font-semibold">Language Settings</h2>
                  <p className={`text-sm ${getThemeClasses("text-gray-500", "text-gray-400", "text-[#7c6f5a]")}`}>
                    Manage language and localization preferences
                  </p>
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Display Language</h3>
                    <p
                      className={`text-sm mb-4 ${getThemeClasses("text-gray-500", "text-gray-400", "text-[#7c6f5a]")}`}
                    >
                      Select the language you want to use for the dashboard interface
                    </p>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {languageOptions.map((lang) => (
                        <div
                          key={lang.value}
                          className={`border rounded-lg p-4 cursor-pointer flex items-center gap-3 ${language === lang.value ? `border-[#22c984] ${getThemeClasses("bg-gray-50", "bg-gray-700", "bg-[#efe9d8]")}` : getThemeClasses("border-gray-200", "border-gray-700", "border-[#e8e4d3]")}`}
                          onClick={() => setLanguage(lang.value)}
                        >
                          <div className="text-2xl">{lang.flag}</div>
                          <div>
                            <p className="font-medium">{lang.name}</p>
                            <p
                              className={`text-xs ${getThemeClasses("text-gray-500", "text-gray-400", "text-[#7c6f5a]")}`}
                            >
                              {lang.value === "english" ? "Default" : ""}
                            </p>
                          </div>
                          {language === lang.value && (
                            <Check
                              className={`ml-auto h-5 w-5 ${getThemeClasses("text-[#22c984]", "text-[#22c984]", "text-[#22c984]")}`}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={`pt-4 border-t ${getThemeClasses("", "border-gray-700", "border-[#e8e4d3]")}`}>
                    <h3 className="font-medium mb-4">Regional Settings</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="date-format">Date Format</Label>
                        <select
                          id="date-format"
                          className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${getThemeClasses("border-input bg-background", "bg-gray-700 border-gray-600", "bg-[#f8f4e3] border-[#e8e4d3]")}`}
                        >
                          <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                          <option value="DD/MM/YYYY">DD/MM/YYYY (Europe)</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                        </select>
                      </div>

                      <div>
                        <Label htmlFor="time-format">Time Format</Label>
                        <select
                          id="time-format"
                          className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${getThemeClasses("border-input bg-background", "bg-gray-700 border-gray-600", "bg-[#f8f4e3] border-[#e8e4d3]")}`}
                        >
                          <option value="12">12-hour (AM/PM)</option>
                          <option value="24">24-hour</option>
                        </select>
                      </div>

                      <div>
                        <Label htmlFor="timezone">Timezone</Label>
                        <select
                          id="timezone"
                          className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${getThemeClasses("border-input bg-background", "bg-gray-700 border-gray-600", "bg-[#f8f4e3] border-[#e8e4d3]")}`}
                        >
                          <option value="America/New_York">Eastern Time (ET)</option>
                          <option value="America/Chicago">Central Time (CT)</option>
                          <option value="America/Denver">Mountain Time (MT)</option>
                          <option value="America/Los_Angeles">Pacific Time (PT)</option>
                          <option value="Europe/London">Greenwich Mean Time (GMT)</option>
                          <option value="Europe/Paris">Central European Time (CET)</option>
                          <option value="Asia/Tokyo">Japan Standard Time (JST)</option>
                        </select>
                      </div>

                      <div>
                        <Label htmlFor="currency">Currency</Label>
                        <select
                          id="currency"
                          className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${getThemeClasses("border-input bg-background", "bg-gray-700 border-gray-600", "bg-[#f8f4e3] border-[#e8e4d3]")}`}
                        >
                          <option value="USD">US Dollar ($)</option>
                          <option value="EUR">Euro (€)</option>
                          <option value="GBP">British Pound (£)</option>
                          <option value="JPY">Japanese Yen (¥)</option>
                          <option value="CNY">Chinese Yuan (¥)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className={`pt-4 border-t ${getThemeClasses("", "border-gray-700", "border-[#e8e4d3]")}`}>
                    <h3 className="font-medium mb-4">Translation</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Auto-translate Documents</h4>
                          <p
                            className={`text-sm ${getThemeClasses("text-gray-500", "text-gray-400", "text-[#7c6f5a]")}`}
                          >
                            Automatically translate documents to your preferred language
                          </p>
                        </div>
                        <Switch />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Community Posts Translation</h4>
                          <p
                            className={`text-sm ${getThemeClasses("text-gray-500", "text-gray-400", "text-[#7c6f5a]")}`}
                          >
                            Show translation options for community posts
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>

                  <Button
                    className={getThemeClasses(
                      "bg-[#22c984] hover:bg-[#1eac73] text-white",
                      "bg-[#22c984] hover:bg-[#1eac73] text-white",
                      "bg-[#22c984] hover:bg-[#1eac73] text-white",
                    )}
                  >
                    Save Language Settings
                  </Button>
                </div>
              </TabsContent>
            </Card>
          </div>
        </div>
      </Tabs>
    </div>
  )
}

