"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Bell, Search, Filter, Plus, Mail, MessageSquare, Calendar, Settings, AlertTriangle, CheckCircle2, Clock, Edit, Trash2, MoreHorizontal, Send, Eye, Download, RefreshCw } from 'lucide-react'

interface NotificationTemplateProps {
  id: string
  name: string
  type: string
  subject: string
  body: string
  lastEdited: string
  status: "active" | "draft" | "archived"
}

interface NotificationLogProps {
  id: string
  type: string
  recipient: string
  subject: string
  sentAt: string
  status: "delivered" | "failed" | "pending"
  openRate?: string
}

interface NotificationChannelProps {
  id: string
  name: string
  type: "email" | "sms" | "push" | "in-app"
  status: boolean
  deliveryRate: string
  openRate?: string
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState("templates")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplateProps | null>(null)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  
  // Sample notification templates
  const notificationTemplates: NotificationTemplateProps[] = [
    {
      id: "temp-001",
      name: "Welcome Email",
      type: "email",
      subject: "Welcome to Our Platform!",
      body: "Hello {{user.firstName}},\n\nWelcome to our platform! We're excited to have you on board.\n\nTo get started, please complete your profile and explore our features.\n\nBest regards,\nThe Team",
      lastEdited: "Mar 5, 2025",
      status: "active"
    },
    {
      id: "temp-002",
      name: "Document Approval",
      type: "email",
      subject: "Your Document Has Been Approved",
      body: "Hello {{user.firstName}},\n\nWe're pleased to inform you that your {{document.type}} has been approved.\n\nYou can view and download it from your dashboard.\n\nBest regards,\nThe Team",
      lastEdited: "Mar 3, 2025",
      status: "active"
    },
    {
      id: "temp-003",
      name: "Payment Reminder",
      type: "email",
      subject: "Payment Reminder: Invoice #{{invoice.number}}",
      body: "Hello {{user.firstName}},\n\nThis is a friendly reminder that invoice #{{invoice.number}} for {{invoice.amount}} is due on {{invoice.dueDate}}.\n\nPlease make your payment at your earliest convenience.\n\nBest regards,\nThe Team",
      lastEdited: "Feb 28, 2025",
      status: "active"
    },
    {
      id: "temp-004",
      name: "Compliance Alert",
      type: "email",
      subject: "Action Required: Compliance Document Due",
      body: "Hello {{user.firstName}},\n\nThis is to remind you that your {{document.type}} is due by {{document.dueDate}}.\n\nFailure to submit this document may result in compliance issues.\n\nBest regards,\nThe Team",
      lastEdited: "Mar 1, 2025",
      status: "active"
    },
    {
      id: "temp-005",
      name: "New Message Notification",
      type: "push",
      subject: "New Message from Support",
      body: "You have received a new message from our support team regarding your recent inquiry.",
      lastEdited: "Mar 4, 2025",
      status: "active"
    },
    {
      id: "temp-006",
      name: "Account Verification",
      type: "sms",
      subject: "Verification Code",
      body: "Your verification code is {{code}}. It will expire in 10 minutes.",
      lastEdited: "Feb 25, 2025",
      status: "active"
    },
    {
      id: "temp-007",
      name: "Subscription Renewal",
      type: "email",
      subject: "Your Subscription Will Renew Soon",
      body: "Hello {{user.firstName}},\n\nYour subscription will automatically renew on {{subscription.renewalDate}}.\n\nIf you wish to make any changes, please visit your account settings.\n\nBest regards,\nThe Team",
      lastEdited: "Mar 2, 2025",
      status: "draft"
    },
    {
      id: "temp-008",
      name: "Document Rejection",
      type: "email",
      subject: "Document Requires Revision",
      body: "Hello {{user.firstName}},\n\nUnfortunately, your {{document.type}} requires some revisions before it can be approved.\n\nReason: {{document.rejectionReason}}\n\nPlease make the necessary changes and resubmit.\n\nBest regards,\nThe Team",
      lastEdited: "Feb 27, 2025",
      status: "draft"
    }
  ]
  
  // Sample notification logs
  const notificationLogs: NotificationLogProps[] = [
    {
      id: "log-001",
      type: "email",
      recipient: "john.doe@example.com",
      subject: "Welcome to Our Platform!",
      sentAt: "Mar 7, 2025 - 10:23 AM",
      status: "delivered",
      openRate: "Yes"
    },
    {
      id: "log-002",
      type: "email",
      recipient: "jane.smith@example.com",
      subject: "Your Document Has Been Approved",
      sentAt: "Mar 7, 2025 - 09:15 AM",
      status: "delivered",
      openRate: "Yes"
    },
    {
      id: "log-003",
      type: "sms",
      recipient: "+1 (555) 123-4567",
      subject: "Verification Code",
      sentAt: "Mar 6, 2025 - 03:45 PM",
      status: "delivered",
      openRate: "N/A"
    },
    {
      id: "log-004",
      type: "email",
      recipient: "robert.johnson@example.com",
      subject: "Payment Reminder: Invoice #INV-2025-003",
      sentAt: "Mar 6, 2025 - 02:30 PM",
      status: "delivered",
      openRate: "No"
    },
    {
      id: "log-005",
      type: "push",
      recipient: "User ID: 12345",
      subject: "New Message from Support",
      sentAt: "Mar 6, 2025 - 11:20 AM",
      status: "delivered",
      openRate: "Yes"
    },
    {
      id: "log-006",
      type: "email",
      recipient: "emily.chen@example.com",
      subject: "Action Required: Compliance Document Due",
      sentAt: "Mar 5, 2025 - 04:10 PM",
      status: "delivered",
      openRate: "Yes"
    },
    {
      id: "log-007",
      type: "email",
      recipient: "david.lee@example.com",
      subject: "Your Subscription Will Renew Soon",
      sentAt: "Mar 5, 2025 - 01:45 PM",
      status: "failed",
      openRate: "N/A"
    },
    {
      id: "log-008",
      type: "sms",
      recipient: "+1 (555) 987-6543",
      subject: "Verification Code",
      sentAt: "Mar 5, 2025 - 10:30 AM",
      status: "delivered",
      openRate: "N/A"
    },
    {
      id: "log-009",
      type: "email",
      recipient: "lisa.wong@example.com",
      subject: "Document Requires Revision",
      sentAt: "Mar 4, 2025 - 03:20 PM",
      status: "delivered",
      openRate: "Yes"
    },
    {
      id: "log-010",
      type: "push",
      recipient: "User ID: 67890",
      subject: "New Message from Support",
      sentAt: "Mar 4, 2025 - 11:15 AM",
      status: "pending",
      openRate: "N/A"
    }
  ]
  
  // Sample notification channels
  const notificationChannels: NotificationChannelProps[] = [
    {
      id: "channel-001",
      name: "Transactional Email",
      type: "email",
      status: true,
      deliveryRate: "98.5%",
      openRate: "45.2%"
    },
    {
      id: "channel-002",
      name: "Marketing Email",
      type: "email",
      status: true,
      deliveryRate: "97.8%",
      openRate: "32.1%"
    },
    {
      id: "channel-003",
      name: "SMS Notifications",
      type: "sms",
      status: true,
      deliveryRate: "99.1%",
      openRate: "N/A"
    },
    {
      id: "channel-004",
      name: "Mobile Push Notifications",
      type: "push",
      status: true,
      deliveryRate: "95.3%",
      openRate: "68.7%"
    },
    {
      id: "channel-005",
      name: "In-App Notifications",
      type: "in-app",
      status: true,
      deliveryRate: "100%",
      openRate: "72.4%"
    }
  ]
  
  const filteredTemplates = notificationTemplates.filter((template) => {
    return (
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.subject.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })
  
  const filteredLogs = notificationLogs.filter((log) => {
    return (
      log.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.type.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })
  
  const handleEditTemplate = (template: NotificationTemplateProps) => {
    setSelectedTemplate(template)
    setShowTemplateDialog(true)
  }
  
  const handleDeleteTemplate = (template: NotificationTemplateProps) => {
    setSelectedTemplate(template)
    setShowDeleteDialog(true)
  }
  
  const handlePreviewTemplate = (template: NotificationTemplateProps) => {
    setSelectedTemplate(template)
    setShowPreviewDialog(true)
  }
  
  const handleCreateTemplate = () => {
    setSelectedTemplate(null)
    setShowTemplateDialog(true)
  }
  
  return (
    <div className="p-6 max-w-[1600px] mx-auto mb-40">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Notification Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage notification templates, delivery channels, and notification history
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <Button variant="outline" size="sm" className="flex items-center">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleCreateTemplate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        </div>
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid grid-cols-1 md:grid-cols-3 w-full md:w-auto">
          <TabsTrigger value="templates" className="flex items-center">
            <MessageSquare className="mr-2 h-4 w-4" />
            Notification Templates
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center">
            <Calendar className="mr-2 h-4 w-4" />
            Notification Logs
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            Notification Settings
          </TabsTrigger>
        </TabsList>
        
        {/* Search Bar */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={`Search ${activeTab === "templates" ? "templates" : activeTab === "logs" ? "notification logs" : "settings"}...`}
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* Templates Tab */}
        <TabsContent value="templates" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {template.type.charAt(0).toUpperCase() + template.type.slice(1)} Template
                      </CardDescription>
                    </div>
                    <TemplateStatusBadge status={template.status} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Subject</h4>
                    <p className="text-sm">{template.subject}</p>
                  </div>
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Preview</h4>
                    <p className="text-sm line-clamp-3">{template.body}</p>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                    <span>Last edited: {template.lastEdited}</span>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => handlePreviewTemplate(template)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEditTemplate(template)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteTemplate(template)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        {/* Logs Tab */}
        <TabsContent value="logs" className="mt-6">
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium text-sm">Type</th>
                    <th className="text-left p-4 font-medium text-sm">Recipient</th>
                    <th className="text-left p-4 font-medium text-sm">Subject</th>
                    <th className="text-left p-4 font-medium text-sm">Sent At</th>
                    <th className="text-left p-4 font-medium text-sm">Status</th>
                    <th className="text-left p-4 font-medium text-sm">Opened</th>
                    <th className="text-left p-4 font-medium text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="p-4">
                        <NotificationTypeBadge type={log.type} />
                      </td>
                      <td className="p-4 max-w-[200px] truncate">{log.recipient}</td>
                      <td className="p-4 max-w-[300px] truncate">{log.subject}</td>
                      <td className="p-4 text-sm">{log.sentAt}</td>
                      <td className="p-4">
                        <NotificationStatusBadge status={log.status} />
                      </td>
                      <td className="p-4 text-sm">{log.openRate}</td>
                      <td className="p-4">
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
        
        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Notification Channels */}
            <Card>
              <CardHeader>
                <CardTitle>Notification Channels</CardTitle>
                <CardDescription>
                  Configure your notification delivery channels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notificationChannels.map((channel) => (
                    <div key={channel.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center">
                        <div className="mr-4">
                          {channel.type === "email" && <Mail className="h-5 w-5 text-blue-500" />}
                          {channel.type === "sms" && <MessageSquare className="h-5 w-5 text-green-500" />}
                          {channel.type === "push" && <Bell className="h-5 w-5 text-amber-500" />}
                          {channel.type === "in-app" && <MessageSquare className="h-5 w-5 text-purple-500" />}
                        </div>
                        <div>
                          <h4 className="font-medium">{channel.name}</h4>
                          <div className="flex space-x-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                            <span>Delivery: {channel.deliveryRate}</span>
                            {channel.openRate && <span>Open Rate: {channel.openRate}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Switch checked={channel.status} />
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Notification Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>Default Notification Preferences</CardTitle>
                <CardDescription>
                  Set default notification preferences for all clients
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-3">Account Notifications</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="account-updates" />
                          <Label htmlFor="account-updates">Account updates</Label>
                        </div>
                        <div className="flex space-x-2">
                          <Badge variant="outline">Email</Badge>
                          <Badge variant="outline">Push</Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="security-alerts" defaultChecked />
                          <Label htmlFor="security-alerts">Security alerts</Label>
                        </div>
                        <div className="flex space-x-2">
                          <Badge variant="outline">Email</Badge>
                          <Badge variant="outline">SMS</Badge>
                          <Badge variant="outline">Push</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-3">Document Notifications</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="document-approval" defaultChecked />
                          <Label htmlFor="document-approval">Document approval</Label>
                        </div>
                        <div className="flex space-x-2">
                          <Badge variant="outline">Email</Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="document-rejection" defaultChecked />
                          <Label htmlFor="document-rejection">Document rejection</Label>
                        </div>
                        <div className="flex space-x-2">
                          <Badge variant="outline">Email</Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="document-expiry" defaultChecked />
                          <Label htmlFor="document-expiry">Document expiry</Label>
                        </div>
                        <div className="flex space-x-2">
                          <Badge variant="outline">Email</Badge>
                          <Badge variant="outline">Push</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-3">Billing Notifications</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="invoice-created" defaultChecked />
                          <Label htmlFor="invoice-created">Invoice created</Label>
                        </div>
                        <div className="flex space-x-2">
                          <Badge variant="outline">Email</Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="payment-reminder" defaultChecked />
                          <Label htmlFor="payment-reminder">Payment reminder</Label>
                        </div>
                        <div className="flex space-x-2">
                          <Badge variant="outline">Email</Badge>
                          <Badge variant="outline">SMS</Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="payment-received" defaultChecked />
                          <Label htmlFor="payment-received">Payment received</Label>
                        </div>
                        <div className="flex space-x-2">
                          <Badge variant="outline">Email</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Email Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Email Settings</CardTitle>
                <CardDescription>
                  Configure email sender details and SMTP settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sender-name">Sender Name</Label>
                      <Input id="sender-name" defaultValue="Company Support" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sender-email">Sender Email</Label>
                      <Input id="sender-email" defaultValue="support@company.com" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reply-to">Reply-To Email</Label>
                    <Input id="reply-to" defaultValue="no-reply@company.com" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="smtp-host">SMTP Host</Label>
                    <Input id="smtp-host" defaultValue="smtp.company.com" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtp-port">SMTP Port</Label>
                      <Input id="smtp-port" defaultValue="587" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp-security">Security</Label>
                      <Select defaultValue="tls">
                        <SelectTrigger id="smtp-security">
                          <SelectValue placeholder="Select security type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="ssl">SSL</SelectItem>
                          <SelectItem value="tls">TLS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtp-username">SMTP Username</Label>
                      <Input id="smtp-username" defaultValue="smtp-user" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp-password">SMTP Password</Label>
                      <Input id="smtp-password" type="password" defaultValue="••••••••••••" />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-4">
                    <Button variant="outline">Test Connection</Button>
                    <Button className="bg-purple-600 hover:bg-purple-700">Save Settings</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* SMS Settings */}
            <Card>
              <CardHeader>
                <CardTitle>SMS Settings</CardTitle>
                <CardDescription>
                  Configure SMS provider settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="sms-provider">SMS Provider</Label>
                    <Select defaultValue="twilio">
                      <SelectTrigger id="sms-provider">
                        <SelectValue placeholder="Select SMS provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="twilio">Twilio</SelectItem>
                        <SelectItem value="aws-sns">AWS SNS</SelectItem>
                        <SelectItem value="messagebird">MessageBird</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="account-sid">Account SID</Label>
                    <Input id="account-sid" defaultValue="AC1a2b3c4d5e6f7g8h9i0j" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="auth-token">Auth Token</Label>
                    <Input id="auth-token" type="password" defaultValue="••••••••••••" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sender-phone">Sender Phone Number</Label>
                    <Input id="sender-phone" defaultValue="+1234567890" />
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-4">
                    <Button variant="outline">Test SMS</Button>
                    <Button className="bg-purple-600 hover:bg-purple-700">Save Settings</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>{selectedTemplate ? "Edit Template" : "Create Template"}</DialogTitle>
            <DialogDescription>
              {selectedTemplate ? "Make changes to the notification template." : "Create a new notification template."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="template-name" className="text-right">
                Name
              </Label>
              <Input
                id="template-name"
                defaultValue={selectedTemplate?.name || ""}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="template-type" className="text-right">
                Type
              </Label>
              <Select defaultValue={selectedTemplate?.type || "email"}>
                <SelectTrigger id="template-type" className="col-span-3">
                  <SelectValue placeholder="Select template type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="push">Push Notification</SelectItem>
                  <SelectItem value="in-app">In-App Notification</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="template-subject" className="text-right">
                Subject
              </Label>
              <Input
                id="template-subject"
                defaultValue={selectedTemplate?.subject || ""}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="template-body" className="text-right pt-2">
                Body
              </Label>
              <Textarea
                id="template-body"
                defaultValue={selectedTemplate?.body || ""}
                className="col-span-3 min-h-[200px]"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="template-status" className="text-right">
                Status
              </Label>
              <Select defaultValue={selectedTemplate?.status || "draft"}>
                <SelectTrigger id="template-status" className="col-span-3">
                  <SelectValue placeholder="Select template status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700">
              {selectedTemplate ? "Save Changes" : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the "{selectedTemplate?.name}" template? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive">
              Delete Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Template Preview: {selectedTemplate?.name}</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Subject</h3>
              <p>{selectedTemplate?.subject}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Body</h3>
              <div className="p-4 border rounded-md bg-gray-50 dark:bg-gray-800 whitespace-pre-line">
                {selectedTemplate?.body}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
              Close
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Send className="mr-2 h-4 w-4" />
              Send Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TemplateStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'active':
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30">
          Active
        </Badge>
      )
    case 'draft':
      return (
        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30">
          Draft
        </Badge>
      )
    case 'archived':
      return (
        <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
          Archived
        </Badge>
      )
    default:
      return null
  }
}

function NotificationTypeBadge({ type }: { type: string }) {
  switch (type) {
    case 'email':
      return (
        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30">
          <Mail className="mr-1 h-3 w-3" />
          Email
        </Badge>
      )
    case 'sms':
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30">
          <MessageSquare className="mr-1 h-3 w-3" />
          SMS
        </Badge>
      )
    case 'push':
      return (
        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30">
          <Bell className="mr-1 h-3 w-3" />
          Push
        </Badge>
      )
    default:
      return (
        <Badge>
          {type}
        </Badge>
      )
  }
}

function NotificationStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'delivered':
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Delivered
        </Badge>
      )
    case 'failed':
      return (
        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30">
          <AlertTriangle className="mr-1 h-3 w-3" />
          Failed
        </Badge>
      )
    case 'pending':
      return (
        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30">
          <Clock className="mr-1 h-3 w-3" />
          Pending
        </Badge>
      )
    default:
      return (
        <Badge>
          {status}
        </Badge>
      )
  }
}
