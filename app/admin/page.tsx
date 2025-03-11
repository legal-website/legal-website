"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, FileText, CreditCard, Search, ShoppingCart, Menu } from "lucide-react"
import Link from "next/link"

export default function AdminPage() {
  return (
    <div>
      {/* Top Bar */}
      <div className="bg-emerald-500 text-white py-2 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <span className="mr-2">📍</span>
              <span>7901, N STE 15322, St. Petersburg, FL</span>
            </div>
            <div className="flex items-center">
              <span className="mr-2">📞</span>
              <span>+1 123 456 789</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span>info@orizen.com</span>
            <div className="flex items-center space-x-2">
              <Link href="#" className="hover:opacity-80">
                FB
              </Link>
              <Link href="#" className="hover:opacity-80">
                IG
              </Link>
              <Link href="#" className="hover:opacity-80">
                IN
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-2xl font-bold text-emerald-500">
                Orizen
              </Link>
              <nav className="hidden md:flex items-center space-x-6">
                <Link href="#" className="text-gray-600 hover:text-emerald-500">
                  Pricing
                </Link>
                <Link href="#" className="text-gray-600 hover:text-emerald-500">
                  Why Choose Us
                </Link>
                <Link href="#" className="text-gray-600 hover:text-emerald-500">
                  How To Start
                </Link>
                <Link href="#" className="text-gray-600 hover:text-emerald-500">
                  FAQs
                </Link>
                <Link href="#" className="text-gray-600 hover:text-emerald-500">
                  States
                </Link>
                <Link href="#" className="text-gray-600 hover:text-emerald-500">
                  Contact Us
                </Link>
                <Link href="#" className="text-gray-600 hover:text-emerald-500">
                  About Us
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <Search className="w-5 h-5 text-gray-600" />
              </button>
              <div className="relative">
                <ShoppingCart className="w-5 h-5 text-gray-600" />
                <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  1
                </span>
              </div>
              <Button variant="default" className="bg-black text-white hover:bg-gray-800">
                Sign in
              </Button>
              <button className="md:hidden p-2 hover:bg-gray-100 rounded-full">
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
          <p className="text-gray-600">
            Welcome to the admin dashboard. From here you can manage your organization's settings, users, and content.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Card className="p-6 border-2 hover:border-emerald-500 transition-colors cursor-pointer">
              <Users className="w-8 h-8 text-emerald-500 mb-4" />
              <h2 className="text-lg font-semibold mb-2">User Management</h2>
              <p className="text-gray-600 text-sm">Manage users, roles, and permissions</p>
            </Card>

            <Card className="p-6 border-2 hover:border-emerald-500 transition-colors cursor-pointer">
              <FileText className="w-8 h-8 text-emerald-500 mb-4" />
              <h2 className="text-lg font-semibold mb-2">Content Management</h2>
              <p className="text-gray-600 text-sm">Edit pages, posts, and media</p>
            </Card>

            <Card className="p-6 border-2 hover:border-emerald-500 transition-colors cursor-pointer">
              <CreditCard className="w-8 h-8 text-emerald-500 mb-4" />
              <h2 className="text-lg font-semibold mb-2">Billing</h2>
              <p className="text-gray-600 text-sm">View and manage payments</p>
            </Card>
          </div>
        </Card>
      </div>
    </div>
  )
}

