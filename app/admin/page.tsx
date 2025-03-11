"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, FileText, CreditCard } from "lucide-react"

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Welcome back. Here&apos;s what&apos;s happening today.
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <Button variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatCard title="Total Users" value="2,543" icon={Users} />
        <StatCard title="Active Documents" value="8,942" icon={FileText} />
        <StatCard title="Revenue" value="$42,389" icon={CreditCard} />
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex border-b mb-4">
          {["overview", "users", "documents", "settings"].map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2 ${
                activeTab === tab ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <Card className="p-6">
            <h2 className="text-lg font-medium mb-4">Overview</h2>
            <p>Welcome to the admin dashboard. Select a tab to manage different aspects of your application.</p>
          </Card>
        )}

        {activeTab === "users" && (
          <Card className="p-6">
            <h2 className="text-lg font-medium mb-4">User Management</h2>
            <p>Manage users, permissions, and roles here.</p>
          </Card>
        )}

        {activeTab === "documents" && (
          <Card className="p-6">
            <h2 className="text-lg font-medium mb-4">Document Management</h2>
            <p>Upload, manage, and organize documents for all clients.</p>
          </Card>
        )}

        {activeTab === "settings" && (
          <Card className="p-6">
            <h2 className="text-lg font-medium mb-4">Settings</h2>
            <p>Configure system settings and preferences.</p>
          </Card>
        )}
      </div>
    </div>
  )
}

// Component for stats cards
function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string
  value: string
  icon: React.ElementType
}) {
  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
            <Icon className="h-6 w-6 text-blue-500" />
          </div>
        </div>
        <h3 className="text-2xl font-bold mb-1">{value}</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm">{title}</p>
      </div>
    </Card>
  )
}

