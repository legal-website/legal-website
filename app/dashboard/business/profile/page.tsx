"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Building, Calendar, Eye, EyeOff, Mail, MapPin, Phone, User, Loader2 } from "lucide-react"
import { useSession } from "next-auth/react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

interface BusinessData {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
  website?: string | null
  industry?: string | null
  formationDate?: Date | null
  ein?: string | null
  businessId?: string | null
  createdAt: Date
  updatedAt: Date
  serviceStatus?: string
  llcStatusMessage?: string
  llcProgress?: number
  annualReportFee?: number
  annualReportFrequency?: number
  displayIndustry?: string
}

interface UserData {
  id: string
  name?: string | null
  email: string
  phone?: string | null
  address?: string | null
}

interface UserAddress {
  id: string
  userId: string
  street: string
  city: string
  state: string
  zipCode: string
  country: string
  createdAt: Date
  updatedAt: Date
}

interface BusinessProfileResponse {
  business: BusinessData | null
  user: UserData
}

export default function BusinessProfilePage() {
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [resettingPassword, setResettingPassword] = useState(false)

  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")

  const [businessInfo, setBusinessInfo] = useState({
    name: "",
    email: "",
    formationDate: "",
    phone: "",
    address: "",
    website: "",
    industry: "Technology", // Default value
    ein: "",
    businessId: "",
  })

  // Fetch business profile data
  const fetchBusinessData = async () => {
    try {
      const response = await fetch("/api/user/business-profile")
      if (!response.ok) {
        throw new Error(`Error fetching business profile: ${response.status}`)
      }

      const data: BusinessProfileResponse = await response.json()

      // Fetch user address separately
      const addressResponse = await fetch("/api/user/address")
      let formattedAddress = ""

      if (addressResponse.ok) {
        const addressData = await addressResponse.json()
        if (addressData.address) {
          const addr = addressData.address
          formattedAddress = `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}, ${addr.country}`
        }
      }

      if (data.business || data.user) {
        // Get industry display value
        let industryDisplay = "Technology"
        if (data.business?.industry) {
          try {
            const parsedIndustry = JSON.parse(data.business.industry)
            industryDisplay = parsedIndustry.displayIndustry || "Technology"
          } catch (e) {
            industryDisplay = data.business.industry
          }
        }

        return {
          name: data.business?.name || data.user?.name || "",
          businessId: data.business?.businessId || "",
          formationDate: data.business?.formationDate ? new Date(data.business.formationDate).toLocaleDateString() : "",
          ein: data.business?.ein || "",
          address: formattedAddress || data.user?.address || data.business?.address || "",
          phone: data.user?.phone || data.business?.phone || "",
          email: data.user?.email || data.business?.email || "",
          website: data.business?.website || "",
          industry: data.business?.displayIndustry || industryDisplay,
        }
      }
      return null
    } catch (error) {
      console.error("Error fetching business data:", error)
      return null
    }
  }

  // Load all data
  const loadAllData = async () => {
    setLoading(true)
    try {
      const businessData = await fetchBusinessData()

      if (businessData) {
        setBusinessInfo({
          name: businessData.name || "",
          email: businessData.email || "",
          formationDate: businessData.formationDate || "",
          phone: businessData.phone || "",
          address: businessData.address || "",
          website: businessData.website || "",
          industry: businessData.industry || "Technology",
          ein: businessData.ein || "",
          businessId: businessData.businessId || "",
        })
      }
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Failed to load business profile data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Update user info
  const updateUserInfo = async (updatedInfo: {
    phone?: string
    address?: string
    website?: string
    industry?: string
  }) => {
    if (!session?.user?.id) return false

    try {
      const response = await fetch(`/api/user/business-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedInfo),
      })

      if (!response.ok) {
        throw new Error("Failed to update user information")
      }

      const data = await response.json()
      return data.success
    } catch (error) {
      console.error("Error updating user information:", error)
      return false
    }
  }

  // Reset password
  const resetPassword = async (newPassword: string) => {
    if (!session?.user?.id) return false

    try {
      const response = await fetch(`/api/user/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: newPassword,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to reset password")
      }

      return true
    } catch (error) {
      console.error("Error resetting password:", error)
      return false
    }
  }

  // Load data when session is available
  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      loadAllData()
    } else if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, session, router])

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError("")

    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match")
      return
    }

    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters")
      return
    }

    setResettingPassword(true)
    try {
      const success = await resetPassword(password)

      if (success) {
        toast({
          title: "Success",
          description: "Your password has been reset successfully.",
        })

        setPassword("")
        setConfirmPassword("")
      } else {
        throw new Error("Failed to reset password")
      }
    } catch (error) {
      console.error("Error resetting password:", error)
      setPasswordError("Failed to reset password. Please try again.")

      toast({
        title: "Error",
        description: "Failed to reset password. Please try again.",
        variant: "destructive",
      })
    } finally {
      setResettingPassword(false)
    }
  }

  const handleInfoUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)

    try {
      const success = await updateUserInfo({
        phone: businessInfo.phone,
        website: businessInfo.website,
        industry: businessInfo.industry,
      })

      if (success) {
        toast({
          title: "Success",
          description: "Business information updated successfully.",
        })

        // Reload data to show updated values
        await loadAllData()
      } else {
        throw new Error("Failed to update business information")
      }
    } catch (error) {
      console.error("Error updating business information:", error)
      toast({
        title: "Error",
        description: "Failed to update business information. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="p-4 sm:p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 text-primary animate-spin mb-3 sm:mb-4" />
        <p className="text-base sm:text-lg font-medium text-muted-foreground text-center">
          Loading business profile...
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 mb-20 sm:mb-40">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Business Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
        <div className="md:col-span-2">
          <Card className="mb-8">
            <div className="p-4 sm:p-6 border-b">
              <h2 className="text-lg sm:text-xl font-semibold">Business Information</h2>
            </div>
            <div className="p-4 sm:p-6">
              <form onSubmit={handleInfoUpdate} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <Label htmlFor="business-name">Business Name</Label>
                    <div className="relative">
                      <Input id="business-name" value={businessInfo.name} disabled className="bg-gray-50" />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-gray-500">
                        <Lock className="h-3 w-3" />
                        <span className="hidden sm:inline">Not editable</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="business-email">Email Address</Label>
                    <div className="relative">
                      <Input id="business-email" value={businessInfo.email} disabled className="bg-gray-50" />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-gray-500">
                        <Lock className="h-3 w-3" />
                        <span className="hidden sm:inline">Not editable</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="business-phone">Phone Number</Label>
                    <Input
                      id="business-phone"
                      value={businessInfo.phone}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div>
                    <Label htmlFor="business-website">Website</Label>
                    <Input
                      id="business-website"
                      value={businessInfo.website}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, website: e.target.value })}
                      placeholder="Enter website URL"
                    />
                  </div>

                  <div>
                    <Label htmlFor="business-industry">Industry</Label>
                    <Input
                      id="business-industry"
                      value={businessInfo.industry}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, industry: e.target.value })}
                      placeholder="Enter industry"
                    />
                  </div>

                  <div>
                    <Label htmlFor="business-formation">Formation Date</Label>
                    <Input id="business-formation" value={businessInfo.formationDate} disabled className="bg-gray-50" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="business-address">Business Address</Label>
                  <div className="relative">
                    <Input id="business-address" value={businessInfo.address} disabled className="bg-gray-50" />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-gray-500">
                      <Lock className="h-3 w-3" />
                      <span className="hidden sm:inline">Not editable</span>
                    </div>
                  </div>
                </div>

                <Button type="submit" disabled={updating}>
                  {updating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Information"
                  )}
                </Button>
              </form>
            </div>
          </Card>

          <Card>
            <div className="p-4 sm:p-6 border-b">
              <h2 className="text-lg sm:text-xl font-semibold">Security</h2>
            </div>
            <div className="p-4 sm:p-6">
              <form onSubmit={handlePasswordReset} className="space-y-6">
                <div>
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter new password"
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
                      placeholder="Confirm new password"
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

                {passwordError && (
                  <div className="text-red-500 text-xs sm:text-sm flex items-center gap-2">
                    <AlertCircle className="h-3 sm:h-4 w-3 sm:w-4 flex-shrink-0" />
                    <span className="break-words">{passwordError}</span>
                  </div>
                )}

                <Button type="submit" disabled={resettingPassword}>
                  {resettingPassword ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>
            </div>
          </Card>
        </div>

        <div>
          <Card className="mb-6">
            <div className="p-4 sm:p-6 border-b">
              <h3 className="text-base sm:text-lg font-semibold">Business Details</h3>
            </div>
            <div className="p-4 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Building className="h-4 sm:h-5 w-4 sm:w-5 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-500">Business ID</p>
                    <p className="font-medium text-sm sm:text-base truncate">
                      {businessInfo.businessId || "Not available"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <User className="h-4 sm:h-5 w-4 sm:w-5 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-500">EIN</p>
                    <p className="font-medium text-sm sm:text-base truncate">{businessInfo.ein || "Not available"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <Calendar className="h-4 sm:h-5 w-4 sm:w-5 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-500">Formation Date</p>
                    <p className="font-medium text-sm sm:text-base truncate">
                      {businessInfo.formationDate || "Not available"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <Mail className="h-4 sm:h-5 w-4 sm:w-5 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-500">Email</p>
                    <p className="font-medium text-sm sm:text-base truncate">{businessInfo.email || "Not available"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <Phone className="h-4 sm:h-5 w-4 sm:w-5 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-500">Phone</p>
                    <p className="font-medium text-sm sm:text-base truncate">{businessInfo.phone || "Not available"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <MapPin className="h-4 sm:h-5 w-4 sm:w-5 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-500">Address</p>
                    <p className="font-medium text-sm sm:text-base break-words">
                      {businessInfo.address || "Not available"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4 sm:p-6 border-b">
              <h3 className="text-base sm:text-lg font-semibold">Need Help?</h3>
            </div>
            <div className="p-4 sm:p-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 sm:h-5 w-4 sm:w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-blue-800 text-sm sm:text-base">Contact Support</h4>
                    <p className="text-xs sm:text-sm text-blue-700">
                      Need help updating your business information? Our support team is here to help.
                    </p>
                  </div>
                </div>
              </div>

              <Button variant="outline" className="w-full" onClick={() => router.push("/dashboard/tickets/new")}>
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

