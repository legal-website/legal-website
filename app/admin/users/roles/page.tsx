"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Edit, Trash2, Shield, Users, FileText, Settings, Bell, CreditCard, Info } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Define types for our data
interface Permission {
  id: string
  name: string
  description: string
  category: string
}

interface Role {
  id: number
  name: string
  description: string
  usersCount: number
  isSystem: boolean
  permissions: string[]
  createdAt: string
  updatedAt: string
}

export default function UserRolesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddRoleDialog, setShowAddRoleDialog] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [showEditRoleDialog, setShowEditRoleDialog] = useState(false)
  
  // Sample permissions data
  const permissions: Permission[] = [
    // User Management
    { id: "user_view", name: "View Users", description: "Can view user details", category: "User Management" },
    { id: "user_create", name: "Create Users", description: "Can create new users", category: "User Management" },
    { id: "user_edit", name: "Edit Users", description: "Can edit user details", category: "User Management" },
    { id: "user_delete", name: "Delete Users", description: "Can delete users", category: "User Management" },
    { id: "user_approve", name: "Approve Users", description: "Can approve new user registrations", category: "User Management" },
    
    // Document Management
    { id: "doc_view", name: "View Documents", description: "Can view documents", category: "Document Management" },
    { id: "doc_create", name: "Create Documents", description: "Can create new documents", category: "Document Management" },
    { id: "doc_edit", name: "Edit Documents", description: "Can edit documents", category: "Document Management" },
    { id: "doc_delete", name: "Delete Documents", description: "Can delete documents", category: "Document Management" },
    { id: "doc_approve", name: "Approve Documents", description: "Can approve document submissions", category: "Document Management" },
    
    // Template Management
    { id: "template_view", name: "View Templates", description: "Can view document templates", category: "Template Management" },
    { id: "template_create", name: "Create Templates", description: "Can create new templates", category: "Template Management" },
    { id: "template_edit", name: "Edit Templates", description: "Can edit templates", category: "Template Management" },
    { id: "template_delete", name: "Delete Templates", description: "Can delete templates", category: "Template Management" },
    
    // Promotion Management
    { id: "promo_view", name: "View Promotions", description: "Can view promotions", category: "Promotion Management" },
    { id: "promo_create", name: "Create Promotions", description: "Can create new promotions", category: "Promotion Management" },
    { id: "promo_edit", name: "Edit Promotions", description: "Can edit promotions", category: "Promotion Management" },
    { id: "promo_delete", name: "Delete Promotions", description: "Can delete promotions", category: "Promotion Management" },
    
    // Billing Management
    { id: "billing_view", name: "View Billing", description: "Can view billing information", category: "Billing Management" },
    { id: "billing_process", name: "Process Payments", description: "Can process payments", category: "Billing Management" },
    { id: "billing_refund", name: "Issue Refunds", description: "Can issue refunds", category: "Billing Management" },
    
    // System Settings
    { id: "settings_view", name: "View Settings", description: "Can view system settings", category: "System Settings" },
    { id: "settings_edit", name: "Edit Settings", description: "Can edit system settings", category: "System Settings" },
  ]
  
  // Sample roles data
  const roles: Role[] = [
    {
      id: 1,
      name: "Super Admin",
      description: "Full access to all system features and settings",
      usersCount: 3,
      isSystem: true,
      permissions: permissions.map(p => p.id),
      createdAt: "Jan 1, 2023",
      updatedAt: "Mar 1, 2025",
    },
    {
      id: 2,
      name: "Admin",
      description: "Administrative access with some restrictions",
      usersCount: 8,
      isSystem: true,
      permissions: [
        "user_view", "user_create", "user_edit", "user_approve",
        "doc_view", "doc_create", "doc_edit", "doc_approve",
        "template_view", "template_create", "template_edit",
        "promo_view", "promo_create", "promo_edit",
        "billing_view", "settings_view"
      ],
      createdAt: "Jan 1, 2023",
      updatedAt: "Feb 15, 2025",
    },
    {
      id: 3,
      name: "Support Agent",
      description: "Customer support with limited administrative access",
      usersCount: 12,
      isSystem: true,
      permissions: [
        "user_view", "doc_view", "doc_approve", "template_view", "promo_view", "billing_view"
      ],
      createdAt: "Jan 1, 2023",
      updatedAt: "Jan 30, 2025",
    },
    {
      id: 4,
      name: "Client Admin",
      description: "Administrative access for client companies",
      usersCount: 156,
      isSystem: true,
      permissions: [
        "user_view", "user_create", "user_edit",
        "doc_view", "doc_create", "doc_edit",
        "template_view", "billing_view"
      ],
      createdAt: "Jan 1, 2023",
      updatedAt: "Jan 15, 2025",
    },
    {
      id: 5,
      name: "Client User",
      description: "Basic access for client company employees",
      usersCount: 1243,
      isSystem: true,
      permissions: [
        "user_view", "doc_view", "doc_create", "template_view"
      ],
      createdAt: "Jan 1, 2023",
      updatedAt: "Jan 10, 2025",
    },
    {
      id: 6,
      name: "Compliance Officer",
      description: "Specialized role for compliance monitoring",
      usersCount: 5,
      isSystem: false,
      permissions: [
        "user_view", "doc_view", "doc_approve", "template_view"
      ],
      createdAt: "Feb 10, 2025",
      updatedAt: "Feb 10, 2025",
    },
    {
      id: 7,
      name: "Finance Manager",
      description: "Access to financial and billing features",
      usersCount: 7,
      isSystem: false,
      permissions: [
        "user_view", "billing_view", "billing_process", "billing_refund"
      ],
      createdAt: "Feb 15, 2025",
      updatedAt: "Feb 15, 2025",
    },
  ]
  
  // Filter roles based on search query
  const filteredRoles = roles.filter((role) => {
    return role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           role.description.toLowerCase().includes(searchQuery.toLowerCase())
  })
  
  // Group permissions by category
  const permissionsByCategory = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = []
    }
    acc[permission.category].push(permission)
    return acc
  }, {} as Record<string, Permission[]>)
  
  const editRole = (role: Role) => {
    setSelectedRole(role)
    setShowEditRoleDialog(true)
  }
  
  return (
    <div className="p-6 max-w-[1600px] mx-auto mb-40">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">User Roles</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage roles and permissions in the system
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <Button 
            className="bg-purple-600 hover:bg-purple-700"
            onClick={() => setShowAddRoleDialog(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Role
          </Button>
        </div>
      </div>
      
      {/* Search */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search roles..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {filteredRoles.map((role) => (
          <RoleCard 
            key={role.id} 
            role={role} 
            onEdit={() => editRole(role)} 
          />
        ))}
      </div>
      
      {/* Create Role Dialog */}
      <Dialog open={showAddRoleDialog} onOpenChange={setShowAddRoleDialog}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>
              Define a new role with specific permissions
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role-name" className="text-right">
                Role Name
              </Label>
              <Input id="role-name" placeholder="e.g. Marketing Manager" className="col-span-3" />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role-description" className="text-right">
                Description
              </Label>
              <Input 
                id="role-description" 
                placeholder="Brief description of this role" 
                className="col-span-3" 
              />
            </div>
            
            <div className="grid grid-cols-1 gap-4 mt-4">
              <Label>Permissions</Label>
              
              {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => (
                <Card key={category} className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      {category === "User Management" ? (
                        <Users className="h-5 w-5 mr-2 text-blue-500" />
                      ) : category === "Document Management" ? (
                        <FileText className="h-5 w-5 mr-2 text-green-500" />
                      ) : category === "Template Management" ? (
                        <FileText className="h-5 w-5 mr-2 text-amber-500" />
                      ) : category === "Promotion Management" ? (
                        <Bell className="h-5 w-5 mr-2 text-purple-500" />
                      ) : category === "Billing Management" ? (
                        <CreditCard className="h-5 w-5 mr-2 text-red-500" />
                      ) : (
                        <Settings className="h-5 w-5 mr-2 text-gray-500" />
                      )}
                      <h3 className="font-medium">{category}</h3>
                    </div>
                    <div className="flex items-center">
                      <Label htmlFor={`select-all-${category}`} className="mr-2 text-sm">Select All</Label>
                      <Switch id={`select-all-${category}`} />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {categoryPermissions.map((permission) => (
                      <div key={permission.id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Label htmlFor={permission.id} className="flex-1 cursor-pointer">
                            <span>{permission.name}</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-4 w-4 ml-1 text-gray-400 inline-block" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{permission.description}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </Label>
                        </div>
                        <Switch id={permission.id} />
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddRoleDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700">
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Role Dialog */}
      {selectedRole && (
        <Dialog open={showEditRoleDialog} onOpenChange={setShowEditRoleDialog}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Edit Role: {selectedRole.name}</DialogTitle>
              <DialogDescription>
                Modify role details and permissions
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-role-name" className="text-right">
                  Role Name
                </Label>
                <Input 
                  id="edit-role-name" 
                  defaultValue={selectedRole.name} 
                  className="col-span-3"
                  disabled={selectedRole.isSystem}
                />
                {selectedRole.isSystem && (
                  <p className="col-span-3 col-start-2 text-xs text-amber-500">
                    System roles cannot be renamed
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-role-description" className="text-right">
                  Description
                </Label>
                <Input 
                  id="edit-role-description" 
                  defaultValue={selectedRole.description} 
                  className="col-span-3" 
                />
              </div>
              
              <div className="grid grid-cols-1 gap-4 mt-4">
                <Label>Permissions</Label>
                
                {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => (
                  <Card key={category} className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        {category === "User Management" ? (
                          <Users className="h-5 w-5 mr-2 text-blue-500" />
                        ) : category === "Document Management" ? (
                          <FileText className="h-5 w-5 mr-2 text-green-500" />
                        ) : category === "Template Management" ? (
                          <FileText className="h-5 w-5 mr-2 text-amber-500" />
                        ) : category === "Promotion Management" ? (
                          <Bell className="h-5 w-5 mr-2 text-purple-500" />
                        ) : category === "Billing Management" ? (
                          <CreditCard className="h-5 w-5 mr-2 text-red-500" />
                        ) : (
                          <Settings className="h-5 w-5 mr-2 text-gray-500" />
                        )}
                        <h3 className="font-medium">{category}</h3>
                      </div>
                      <div className="flex items-center">
                        <Label htmlFor={`edit-select-all-${category}`} className="mr-2 text-sm">Select All</Label>
                        <Switch id={`edit-select-all-${category}`} />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {categoryPermissions.map((permission) => (
                        <div key={permission.id} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Label htmlFor={`edit-${permission.id}`} className="flex-1 cursor-pointer">
                              <span>{permission.name}</span>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-4 w-4 ml-1 text-gray-400 inline-block" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{permission.description}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </Label>
                          </div>
                          <Switch 
                            id={`edit-${permission.id}`} 
                            defaultChecked={selectedRole.permissions.includes(permission.id)}
                          />
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditRoleDialog(false)}>
                Cancel
              </Button>
              <Button className="bg-purple-600 hover:bg-purple-700">
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

interface RoleCardProps {
  role: Role
  onEdit: () => void
}

function RoleCard({ role, onEdit }: RoleCardProps) {
  // Calculate the percentage of total permissions
  const totalPermissions = 24 // Total number of permissions in the system
  const permissionPercentage = Math.round((role.permissions.length / totalPermissions) * 100)
  
  return (
    <Card className="overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
              role.name === "Super Admin" 
                ? "bg-purple-100 dark:bg-purple-900/30" 
                : role.name === "Admin" || role.name === "Client Admin"
                ? "bg-blue-100 dark:bg-blue-900/30"
                : role.name === "Support Agent"
                ? "bg-amber-100 dark:bg-amber-900/30"
                : "bg-gray-100 dark:bg-gray-800"
            }`}>
              <Shield className={`h-5 w-5 ${
                role.name === "Super Admin" 
                  ? "text-purple-600 dark:text-purple-400" 
                  : role.name === "Admin" || role.name === "Client Admin"
                  ? "text-blue-600 dark:text-blue-400"
                  : role.name === "Support Agent"
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-gray-600 dark:text-gray-400"
              }`} />
            </div>
            <div>
              <h3 className="font-medium">{role.name}</h3>
              <div className="flex items-center">
                <Users className="h-3 w-3 text-gray-400 mr-1" />
                <span className="text-xs text-gray-500">{role.usersCount} users</span>
              </div>
            </div>
          </div>
          {role.isSystem && (
            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
              System
            </span>
          )}
        </div>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{role.description}</p>
        
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500">Permissions</span>
            <span className="text-xs font-medium">{role.permissions.length}/{totalPermissions}</span>
          </div>
          <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${
                permissionPercentage > 80 
                  ? "bg-purple-500" 
                  : permissionPercentage > 50
                  ? "bg-blue-500"
                  : permissionPercentage > 30
                  ? "bg-amber-500"
                  : "bg-gray-500"
              }`}
              style={{ width: `${permissionPercentage}%` }}
            ></div>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Created: {role.createdAt}</span>
          <span>Updated: {role.updatedAt}</span>
        </div>
        
        <div className="flex justify-end mt-4 space-x-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          {!role.isSystem && (
            <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
