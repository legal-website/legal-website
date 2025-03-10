"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Building, Calendar, Eye, EyeOff, Mail, MapPin, Phone, User } from "lucide-react"

export default function BusinessProfilePage() {
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")

  const [businessInfo, setBusinessInfo] = useState({
    name: "Rapid Ventures LLC",
    email: "contact@rapidventures.com",
    formationDate: "January 15, 2023",
    phone: "(555) 123-4567",
    address: "100 Ambition Parkway, New York, NY 10001, USA",
    website: "www.rapidventures.com",
    industry: "Technology",
    ein: "93-4327510",
    businessId: "10724418",
  })

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match")
      return
    }

    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters")
      return
    }

    // In a real app, this would call an API to reset the password
    setPasswordError("")
    setPassword("")
    setConfirmPassword("")
    alert("Password reset successful")
  }

  const handleInfoUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would call an API to update business info
    alert("Business information updated successfully")
  }

  return (
    <div className="p-8 mb-40">
      <h1 className="text-3xl font-bold mb-6">Business Profile</h1>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card className="mb-8">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Business Information</h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleInfoUpdate} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="business-name">Business Name</Label>
                    <Input
                      id="business-name"
                      value={businessInfo.name}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="business-email">Email Address</Label>
                    <div className="relative">
                      <Input id="business-email" value={businessInfo.email} disabled className="bg-gray-50" />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-gray-500">
                        <Lock className="h-3 w-3" />
                        <span>Not editable</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="business-phone">Phone Number</Label>
                    <Input
                      id="business-phone"
                      value={businessInfo.phone}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="business-website">Website</Label>
                    <Input
                      id="business-website"
                      value={businessInfo.website}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, website: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="business-industry">Industry</Label>
                    <Input
                      id="business-industry"
                      value={businessInfo.industry}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, industry: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="business-formation">Formation Date</Label>
                    <Input id="business-formation" value={businessInfo.formationDate} disabled className="bg-gray-50" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="business-address">Business Address</Label>
                  <Input
                    id="business-address"
                    value={businessInfo.address}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, address: e.target.value })}
                  />
                </div>

                <Button type="submit">Update Information</Button>
              </form>
            </div>
          </Card>

          <Card>
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Security</h2>
            </div>
            <div className="p-6">
              <form onSubmit={handlePasswordReset} className="space-y-6">
                <div>
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {passwordError && <div className="text-red-500 text-sm">{passwordError}</div>}

                <Button type="submit">Reset Password</Button>
              </form>
            </div>
          </Card>
        </div>

        <div>
          <Card className="mb-6">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Business Details</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Building className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Business ID</p>
                    <p className="font-medium">{businessInfo.businessId}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">EIN</p>
                    <p className="font-medium">{businessInfo.ein}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Formation Date</p>
                    <p className="font-medium">{businessInfo.formationDate}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{businessInfo.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{businessInfo.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium">{businessInfo.address}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Need Help?</h3>
            </div>
            <div className="p-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800">Contact Support</h4>
                    <p className="text-sm text-blue-700">
                      Need help updating your business information? Our support team is here to help.
                    </p>
                  </div>
                </div>
              </div>

              <Button variant="outline" className="w-full">
                Contact Support
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Helper component for the "Not editable" icon
function Lock({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  )
}

