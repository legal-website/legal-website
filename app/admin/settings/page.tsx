"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Settings,
  Shield,
  Bell,
  Link,
  Database,
  Users,
  Paintbrush,
  Code,
  Save,
  RefreshCw,
  Lock,
  Mail,
  Check,
  HelpCircle,
  Zap,
  BarChart,
  CreditCard,
  Plus,
} from "lucide-react"

// Define types for our state objects
type PasswordPolicy = {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
  expiryDays: number
  preventReuse: number
}

type NotificationEvents = {
  userRegistration: boolean
  documentUpload: boolean
  paymentReceived: boolean
  complianceAlert: boolean
  systemUpdates: boolean
}

type Integration = {
  enabled: boolean
  apiKey?: string
  trackingId?: string
  webhookUrl?: string
}

type Integrations = {
  stripe: Integration
  googleAnalytics: Integration
  mailchimp: Integration
  zapier: Integration
  slack: Integration
}

type Role = {
  id: number
  name: string
  permissions: string[]
}

export default function SystemSettingsPage() {
  const [activeTab, setActiveTab] = useState("general")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  // General settings state
  const [companyName, setCompanyName] = useState("Rapid Ventures LLC")
  const [adminEmail, setAdminEmail] = useState("admin@rapidventures.com")
  const [timezone, setTimezone] = useState("America/New_York")
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY")
  const [language, setLanguage] = useState("en-US")

  // Security settings state
  const [passwordPolicy, setPasswordPolicy] = useState<PasswordPolicy>({
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    expiryDays: 90,
    preventReuse: 5,
  })
  const [twoFactorAuth, setTwoFactorAuth] = useState(true)
  const [sessionTimeout, setSessionTimeout] = useState(30)
  const [ipRestriction, setIpRestriction] = useState(false)
  const [allowedIPs, setAllowedIPs] = useState("")

  // Notification settings state
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(false)
  const [inAppNotifications, setInAppNotifications] = useState(true)
  const [notificationEvents, setNotificationEvents] = useState<NotificationEvents>({
    userRegistration: true,
    documentUpload: true,
    paymentReceived: true,
    complianceAlert: true,
    systemUpdates: false,
  })

  // Integration settings state
  const [integrations, setIntegrations] = useState<Integrations>({
    stripe: { enabled: true, apiKey: "sk_test_***********************" },
    googleAnalytics: { enabled: true, trackingId: "UA-123456789-1" },
    mailchimp: { enabled: false, apiKey: "" },
    zapier: { enabled: true, webhookUrl: "https://hooks.zapier.com/hooks/catch/123456/abcdef/" },
    slack: { enabled: false, webhookUrl: "" },
  })

  // These variables are used in the Backup & Restore tab
  const [autoBackup, setAutoBackup] = useState(true)
  const [backupFrequency, setBackupFrequency] = useState("daily")
  const [backupRetention, setBackupRetention] = useState(30)
  const [backupLocation, setBackupLocation] = useState("cloud")

  // These variables are used in the User Permissions tab
  const [roles, setRoles] = useState<Role[]>([
    { id: 1, name: "Administrator", permissions: ["all"] },
    { id: 2, name: "Manager", permissions: ["view_all", "edit_documents", "manage_users", "view_reports"] },
    { id: 3, name: "Support", permissions: ["view_documents", "view_users", "respond_tickets"] },
    { id: 4, name: "Client", permissions: ["view_own_documents", "upload_documents", "create_tickets"] },
  ])

  // These variables are used in the Appearance tab
  const [primaryColor, setPrimaryColor] = useState("#6366F1")
  const [logoUrl, setLogoUrl] = useState("/logo.png")
  const [theme, setTheme] = useState("system")
  const [customCss, setCustomCss] = useState("")

  // Advanced settings state
  const [debugMode, setDebugMode] = useState(false)
  const [apiRateLimit, setApiRateLimit] = useState(100)
  const [cacheLifetime, setCacheLifetime] = useState(60)
  const [maintenanceMode, setMaintenanceMode] = useState(false)

  // Handle save settings
  const handleSaveSettings = () => {
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      setIsSaved(true)

      // Reset saved status after 3 seconds
      setTimeout(() => {
        setIsSaved(false)
      }, 3000)
    }, 1500)
  }

  // Handle password policy change
  const handlePasswordPolicyChange = (key: keyof PasswordPolicy, value: number | boolean) => {
    setPasswordPolicy({
      ...passwordPolicy,
      [key]: value,
    })
  }

  // Handle notification events change
  const handleNotificationEventChange = (key: keyof NotificationEvents, value: boolean) => {
    setNotificationEvents({
      ...notificationEvents,
      [key]: value,
    })
  }

  // Handle integration change
  const handleIntegrationChange = (key: keyof Integrations, field: keyof Integration, value: string | boolean) => {
    setIntegrations({
      ...integrations,
      [key]: {
        ...integrations[key],
        [field]: value,
      },
    })
  }

  // Handle backup settings change
  const handleBackupSettingsChange = () => {
    console.log("Backup settings:", { autoBackup, backupFrequency, backupRetention, backupLocation })
    // This function would normally update the backup settings via an API call
  }

  // Handle roles change
  const handleRolesChange = () => {
    console.log("Roles:", roles)
    // This function would normally update the roles via an API call
  }

  // Handle appearance settings change
  const handleAppearanceSettingsChange = () => {
    console.log("Appearance settings:", { primaryColor, logoUrl, theme, customCss })
    // This function would normally update the appearance settings via an API call
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto mb-40">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">System Settings</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Configure and customize your dashboard settings</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <Button variant="outline" size="sm" className="flex items-center" onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button
            className="bg-purple-600 hover:bg-purple-700 flex items-center"
            onClick={handleSaveSettings}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : isSaved ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Saved!
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-64">
            <Card>
              <CardContent className="p-4">
                <TabsList className="flex flex-col w-full h-auto gap-2 bg-transparent">
                  <TabsTrigger value="general" className="w-full justify-start" onClick={() => setActiveTab("general")}>
                    <Settings className="h-4 w-4 mr-2" />
                    General
                  </TabsTrigger>
                  <TabsTrigger
                    value="security"
                    className="w-full justify-start"
                    onClick={() => setActiveTab("security")}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Security
                  </TabsTrigger>
                  <TabsTrigger
                    value="notifications"
                    className="w-full justify-start"
                    onClick={() => setActiveTab("notifications")}
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Notifications
                  </TabsTrigger>
                  <TabsTrigger
                    value="integrations"
                    className="w-full justify-start"
                    onClick={() => setActiveTab("integrations")}
                  >
                    <Link className="h-4 w-4 mr-2" />
                    Integrations
                  </TabsTrigger>
                  <TabsTrigger value="backup" className="w-full justify-start" onClick={() => setActiveTab("backup")}>
                    <Database className="h-4 w-4 mr-2" />
                    Backup & Restore
                  </TabsTrigger>
                  <TabsTrigger
                    value="permissions"
                    className="w-full justify-start"
                    onClick={() => setActiveTab("permissions")}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    User Permissions
                  </TabsTrigger>
                  <TabsTrigger
                    value="appearance"
                    className="w-full justify-start"
                    onClick={() => setActiveTab("appearance")}
                  >
                    <Paintbrush className="h-4 w-4 mr-2" />
                    Appearance
                  </TabsTrigger>
                  <TabsTrigger
                    value="advanced"
                    className="w-full justify-start"
                    onClick={() => setActiveTab("advanced")}
                  >
                    <Code className="h-4 w-4 mr-2" />
                    Advanced
                  </TabsTrigger>
                </TabsList>
              </CardContent>
            </Card>

            {/* System Info Card */}
            <Card className="mt-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">System Information</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Version:</span>
                    <span>3.5.2</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Last Updated:</span>
                    <span>Mar 15, 2025</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Database:</span>
                    <span>PostgreSQL 15.2</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Storage:</span>
                    <span>68.2 GB / 100 GB</span>
                  </div>
                  <div className="mt-4">
                    <Progress value={68} className="h-1" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  <HelpCircle className="h-3 w-3 mr-1" />
                  System Diagnostics
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="flex-1">
            <Card>
              {/* General Settings */}
              <TabsContent value="general" className="m-0">
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>Configure basic system settings and preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="adminEmail">Admin Email</Label>
                      <Input
                        id="adminEmail"
                        type="email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select value={timezone} onValueChange={setTimezone}>
                        <SelectTrigger id="timezone">
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                          <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                          <SelectItem value="Europe/London">London (GMT)</SelectItem>
                          <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                          <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dateFormat">Date Format</Label>
                      <Select value={dateFormat} onValueChange={setDateFormat}>
                        <SelectTrigger id="dateFormat">
                          <SelectValue placeholder="Select date format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                          <SelectItem value="YYYY/MM/DD">YYYY/MM/DD</SelectItem>
                          <SelectItem value="DD-MMM-YYYY">DD-MMM-YYYY</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger id="language">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en-US">English (US)</SelectItem>
                          <SelectItem value="en-GB">English (UK)</SelectItem>
                          <SelectItem value="es-ES">Spanish</SelectItem>
                          <SelectItem value="fr-FR">French</SelectItem>
                          <SelectItem value="de-DE">German</SelectItem>
                          <SelectItem value="ja-JP">Japanese</SelectItem>
                          <SelectItem value="zh-CN">Chinese (Simplified)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="systemUrl">System URL</Label>
                    <Input id="systemUrl" value="https://dashboard.rapidventures.com" disabled />
                    <p className="text-xs text-gray-500 mt-1">
                      This is the base URL of your system. Contact support to change this.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="enableMaintenance">Maintenance Mode</Label>
                      <Switch id="enableMaintenance" checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
                    </div>
                    <p className="text-xs text-gray-500">
                      When enabled, the system will be inaccessible to regular users.
                    </p>
                  </div>
                </CardContent>
              </TabsContent>

              {/* Security Settings */}
              <TabsContent value="security" className="m-0">
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Configure security policies and access controls</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Password Policy</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="minLength">Minimum Password Length</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="minLength"
                            type="number"
                            min="8"
                            max="32"
                            value={passwordPolicy.minLength}
                            onChange={(e) => handlePasswordPolicyChange("minLength", Number.parseInt(e.target.value))}
                          />
                          <span className="text-sm text-gray-500">characters</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="expiryDays">Password Expiry</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="expiryDays"
                            type="number"
                            min="0"
                            max="365"
                            value={passwordPolicy.expiryDays}
                            onChange={(e) => handlePasswordPolicyChange("expiryDays", Number.parseInt(e.target.value))}
                          />
                          <span className="text-sm text-gray-500">days (0 = never)</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="preventReuse">Prevent Password Reuse</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="preventReuse"
                            type="number"
                            min="0"
                            max="24"
                            value={passwordPolicy.preventReuse}
                            onChange={(e) =>
                              handlePasswordPolicyChange("preventReuse", Number.parseInt(e.target.value))
                            }
                          />
                          <span className="text-sm text-gray-500">previous passwords</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="sessionTimeout">Session Timeout</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="sessionTimeout"
                            type="number"
                            min="5"
                            max="1440"
                            value={sessionTimeout}
                            onChange={(e) => setSessionTimeout(Number.parseInt(e.target.value))}
                          />
                          <span className="text-sm text-gray-500">minutes</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="requireUppercase"
                          checked={passwordPolicy.requireUppercase}
                          onCheckedChange={(checked) => handlePasswordPolicyChange("requireUppercase", checked)}
                        />
                        <Label htmlFor="requireUppercase">Require uppercase letters</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="requireLowercase"
                          checked={passwordPolicy.requireLowercase}
                          onCheckedChange={(checked) => handlePasswordPolicyChange("requireLowercase", checked)}
                        />
                        <Label htmlFor="requireLowercase">Require lowercase letters</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="requireNumbers"
                          checked={passwordPolicy.requireNumbers}
                          onCheckedChange={(checked) => handlePasswordPolicyChange("requireNumbers", checked)}
                        />
                        <Label htmlFor="requireNumbers">Require numbers</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="requireSpecialChars"
                          checked={passwordPolicy.requireSpecialChars}
                          onCheckedChange={(checked) => handlePasswordPolicyChange("requireSpecialChars", checked)}
                        />
                        <Label htmlFor="requireSpecialChars">Require special characters</Label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-medium">Two-Factor Authentication</h3>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="twoFactorAuth" className="text-base font-medium">
                          Require 2FA for all users
                        </Label>
                        <p className="text-sm text-gray-500">
                          When enabled, all users will be required to set up two-factor authentication
                        </p>
                      </div>
                      <Switch id="twoFactorAuth" checked={twoFactorAuth} onCheckedChange={setTwoFactorAuth} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="border rounded-lg p-4 flex flex-col items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-2">
                          <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h4 className="font-medium text-sm">Email</h4>
                        <Badge className="mt-2 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          Enabled
                        </Badge>
                      </div>

                      <div className="border rounded-lg p-4 flex flex-col items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-2">
                          <Smartphone className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h4 className="font-medium text-sm">SMS</h4>
                        <Badge className="mt-2 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          Enabled
                        </Badge>
                      </div>

                      <div className="border rounded-lg p-4 flex flex-col items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-2">
                          <Lock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <h4 className="font-medium text-sm">Authenticator App</h4>
                        <Badge className="mt-2 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          Enabled
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-medium">IP Restrictions</h3>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="ipRestriction" className="text-base font-medium">
                          Enable IP Restrictions
                        </Label>
                        <p className="text-sm text-gray-500">
                          When enabled, system access will be limited to specified IP addresses
                        </p>
                      </div>
                      <Switch id="ipRestriction" checked={ipRestriction} onCheckedChange={setIpRestriction} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="allowedIPs">Allowed IP Addresses</Label>
                      <Textarea
                        id="allowedIPs"
                        placeholder="Enter IP addresses, one per line"
                        value={allowedIPs}
                        onChange={(e) => setAllowedIPs(e.target.value)}
                        disabled={!ipRestriction}
                        className="h-24"
                      />
                      <p className="text-xs text-gray-500">
                        Enter one IP address or CIDR range per line (e.g., 192.168.1.1 or 192.168.1.0/24)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </TabsContent>

              {/* Notification Settings */}
              <TabsContent value="notifications" className="m-0">
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>Configure how and when notifications are sent</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Notification Channels</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <Mail className="h-5 w-5 mr-2 text-blue-500" />
                            <h4 className="font-medium">Email Notifications</h4>
                          </div>
                          <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                        </div>
                        <p className="text-sm text-gray-500">Send notifications via email to users</p>
                      </div>

                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <Smartphone className="h-5 w-5 mr-2 text-purple-500" />
                            <h4 className="font-medium">SMS Notifications</h4>
                          </div>
                          <Switch checked={smsNotifications} onCheckedChange={setSmsNotifications} />
                        </div>
                        <p className="text-sm text-gray-500">Send notifications via SMS text messages</p>
                      </div>

                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <Bell className="h-5 w-5 mr-2 text-amber-500" />
                            <h4 className="font-medium">In-App Notifications</h4>
                          </div>
                          <Switch checked={inAppNotifications} onCheckedChange={setInAppNotifications} />
                        </div>
                        <p className="text-sm text-gray-500">Show notifications within the dashboard</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-medium">Notification Events</h3>
                    <p className="text-sm text-gray-500 mb-4">Select which events should trigger notifications</p>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base">User Registration</Label>
                          <p className="text-sm text-gray-500">When a new user registers or is created</p>
                        </div>
                        <Switch
                          checked={notificationEvents.userRegistration}
                          onCheckedChange={(checked) => handleNotificationEventChange("userRegistration", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base">Document Upload</Label>
                          <p className="text-sm text-gray-500">When a document is uploaded or updated</p>
                        </div>
                        <Switch
                          checked={notificationEvents.documentUpload}
                          onCheckedChange={(checked) => handleNotificationEventChange("documentUpload", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base">Payment Received</Label>
                          <p className="text-sm text-gray-500">When a payment is processed successfully</p>
                        </div>
                        <Switch
                          checked={notificationEvents.paymentReceived}
                          onCheckedChange={(checked) => handleNotificationEventChange("paymentReceived", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base">Compliance Alert</Label>
                          <p className="text-sm text-gray-500">When a compliance issue is detected</p>
                        </div>
                        <Switch
                          checked={notificationEvents.complianceAlert}
                          onCheckedChange={(checked) => handleNotificationEventChange("complianceAlert", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base">System Updates</Label>
                          <p className="text-sm text-gray-500">When system updates or maintenance is scheduled</p>
                        </div>
                        <Switch
                          checked={notificationEvents.systemUpdates}
                          onCheckedChange={(checked) => handleNotificationEventChange("systemUpdates", checked)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-medium">Email Settings</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="senderName">Sender Name</Label>
                        <Input
                          id="senderName"
                          placeholder="Rapid Ventures Support"
                          defaultValue="Rapid Ventures Support"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="senderEmail">Sender Email</Label>
                        <Input
                          id="senderEmail"
                          type="email"
                          placeholder="support@rapidventures.com"
                          defaultValue="support@rapidventures.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="emailFooter">Email Footer Text</Label>
                      <Textarea
                        id="emailFooter"
                        placeholder="Enter footer text for all emails"
                        defaultValue="© 2025 Rapid Ventures LLC. All rights reserved."
                        className="h-20"
                      />
                    </div>
                  </div>
                </CardContent>
              </TabsContent>

              {/* Integration Settings */}
              <TabsContent value="integrations" className="m-0">
                <CardHeader>
                  <CardTitle>Integration Settings</CardTitle>
                  <CardDescription>Connect with third-party services and APIs</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Stripe Integration */}
                  <div className="border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mr-3">
                          <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <h3 className="font-medium">Stripe</h3>
                          <p className="text-sm text-gray-500">Payment processing integration</p>
                        </div>
                      </div>
                      <Switch
                        checked={integrations.stripe.enabled}
                        onCheckedChange={(checked) => handleIntegrationChange("stripe", "enabled", checked)}
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="stripeApiKey">API Key</Label>
                        <div className="relative">
                          <Input
                            id="stripeApiKey"
                            type="password"
                            value={integrations.stripe.apiKey}
                            onChange={(e) => handleIntegrationChange("stripe", "apiKey", e.target.value)}
                            disabled={!integrations.stripe.enabled}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full"
                            disabled={!integrations.stripe.enabled}
                          >
                            Show
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 text-sm">
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          Connected
                        </Badge>
                        <span className="text-gray-500">Last verified: Today at 10:23 AM</span>
                      </div>

                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" disabled={!integrations.stripe.enabled}>
                          Test Connection
                        </Button>
                        <Button variant="outline" size="sm" disabled={!integrations.stripe.enabled}>
                          View Dashboard
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Google Analytics Integration */}
                  <div className="border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3">
                          <BarChart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-medium">Google Analytics</h3>
                          <p className="text-sm text-gray-500">Website analytics tracking</p>
                        </div>
                      </div>
                      <Switch
                        checked={integrations.googleAnalytics.enabled}
                        onCheckedChange={(checked) => handleIntegrationChange("googleAnalytics", "enabled", checked)}
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="gaTrackingId">Tracking ID</Label>
                        <Input
                          id="gaTrackingId"
                          value={integrations.googleAnalytics.trackingId}
                          onChange={(e) => handleIntegrationChange("googleAnalytics", "trackingId", e.target.value)}
                          disabled={!integrations.googleAnalytics.enabled}
                        />
                      </div>

                      <div className="flex items-center space-x-2 text-sm">
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          Connected
                        </Badge>
                        <span className="text-gray-500">Last verified: Yesterday at 2:15 PM</span>
                      </div>
                    </div>
                  </div>

                  {/* Zapier Integration */}
                  <div className="border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mr-3">
                          <Zap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                          <h3 className="font-medium">Zapier</h3>
                          <p className="text-sm text-gray-500">Workflow automation</p>
                        </div>
                      </div>
                      <Switch
                        checked={integrations.zapier.enabled}
                        onCheckedChange={(checked) => handleIntegrationChange("zapier", "enabled", checked)}
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="zapierWebhook">Webhook URL</Label>
                        <Input
                          id="zapierWebhook"
                          value={integrations.zapier.webhookUrl}
                          onChange={(e) => handleIntegrationChange("zapier", "webhookUrl", e.target.value)}
                          disabled={!integrations.zapier.enabled}
                        />
                      </div>

                      <div className="flex items-center space-x-2 text-sm">
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          Connected
                        </Badge>
                        <span className="text-gray-500">3 active Zaps</span>
                      </div>
                    </div>
                  </div>

                  {/* Add New Integration Button */}
                  <Button className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Integration
                  </Button>
                </CardContent>
              </TabsContent>

              {/* Backup & Restore Tab */}
              <TabsContent value="backup" className="m-0">
                <CardHeader>
                  <CardTitle>Backup & Restore</CardTitle>
                  <CardDescription>Configure system backup settings and restore options</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Automatic Backups</h3>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="autoBackup" className="text-base font-medium">
                          Enable Automatic Backups
                        </Label>
                        <p className="text-sm text-gray-500">
                          When enabled, the system will automatically create backups on a schedule
                        </p>
                      </div>
                      <Switch id="autoBackup" checked={autoBackup} onCheckedChange={setAutoBackup} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="backupFrequency">Backup Frequency</Label>
                        <Select value={backupFrequency} onValueChange={setBackupFrequency} disabled={!autoBackup}>
                          <SelectTrigger id="backupFrequency">
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hourly">Hourly</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="backupRetention">Retention Period (Days)</Label>
                        <Input
                          id="backupRetention"
                          type="number"
                          min="1"
                          max="365"
                          value={backupRetention}
                          onChange={(e) => setBackupRetention(Number.parseInt(e.target.value))}
                          disabled={!autoBackup}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="backupLocation">Backup Storage Location</Label>
                      <Select value={backupLocation} onValueChange={setBackupLocation} disabled={!autoBackup}>
                        <SelectTrigger id="backupLocation">
                          <SelectValue placeholder="Select storage location" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="local">Local Storage</SelectItem>
                          <SelectItem value="cloud">Cloud Storage</SelectItem>
                          <SelectItem value="both">Both Local & Cloud</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button onClick={handleBackupSettingsChange} disabled={!autoBackup}>
                      Save Backup Settings
                    </Button>
                  </div>
                </CardContent>
              </TabsContent>

              {/* User Permissions Tab */}
              <TabsContent value="permissions" className="m-0">
                <CardHeader>
                  <CardTitle>User Permissions</CardTitle>
                  <CardDescription>Manage user roles and access controls</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">User Roles</h3>

                    <div className="border rounded-md overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-100 dark:bg-gray-800">
                            <th className="px-4 py-2 text-left">Role Name</th>
                            <th className="px-4 py-2 text-left">Permissions</th>
                            <th className="px-4 py-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {roles.map((role) => (
                            <tr key={role.id} className="border-t">
                              <td className="px-4 py-2 font-medium">{role.name}</td>
                              <td className="px-4 py-2">
                                {role.permissions.map((perm) => (
                                  <Badge key={perm} className="mr-1 mb-1">
                                    {perm}
                                  </Badge>
                                ))}
                              </td>
                              <td className="px-4 py-2 text-right">
                                <Button variant="ghost" size="sm" onClick={handleRolesChange}>
                                  Edit
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </TabsContent>

              {/* Appearance Tab */}
              <TabsContent value="appearance" className="m-0">
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>Customize the look and feel of your dashboard</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Theme Settings</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="theme">Theme Mode</Label>
                        <Select value={theme} onValueChange={setTheme}>
                          <SelectTrigger id="theme">
                            <SelectValue placeholder="Select theme" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                            <SelectItem value="system">System</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="primaryColor">Primary Color</Label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            id="primaryColor"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="w-10 h-10 rounded-md border cursor-pointer"
                          />
                          <Input
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="logoUrl">Logo URL</Label>
                      <Input id="logoUrl" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customCss">Custom CSS</Label>
                      <Textarea
                        id="customCss"
                        value={customCss}
                        onChange={(e) => setCustomCss(e.target.value)}
                        className="font-mono h-32"
                        placeholder="/* Add your custom CSS here */"
                      />
                    </div>

                    <Button onClick={handleAppearanceSettingsChange}>Save Appearance Settings</Button>
                  </div>
                </CardContent>
              </TabsContent>

              {/* Rest of the tabs content would continue here... */}
            </Card>
          </div>
        </div>
      </Tabs>
    </div>
  )
}

// Custom icon components with proper TypeScript typing
function Smartphone({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
      <path d="M12 18h.01" />
    </svg>
  )
}

function X({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}

function Edit({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

