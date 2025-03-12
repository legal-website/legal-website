"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Flag,
  Building2,
  Hash,
  Bell,
  FileText,
  Download,
  Phone,
  Eye,
  MessageSquare,
  User,
  Calendar,
  CheckCircle,
} from "lucide-react"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface BusinessData {
  name: string
  businessId: string
  formationDate: string
  ein: string
  email: string
  phone: string
  address: string
  website: string
  industry: string
  // Custom fields for UI display
  serviceStatus: string
  llcProgress: number
  llcStatusMessage: string
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [businessData, setBusinessData] = useState<BusinessData>({
    name: "",
    businessId: "",
    formationDate: "",
    ein: "",
    email: "",
    phone: "",
    address: "",
    website: "",
    industry: "",
    // Default values for UI display
    serviceStatus: "Pending",
    llcProgress: 10,
    llcStatusMessage: "LLC formation initiated",
  })

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  // Fetch business data
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      fetchBusinessData()
    }
  }, [status, session])

  const fetchBusinessData = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/user/business")

      if (!response.ok) {
        throw new Error("Failed to fetch business data")
      }

      const data = await response.json()

      if (data.business) {
        setBusinessData({
          name: data.business.name || "Your Business LLC",
          businessId: data.business.businessId || "10724418",
          formationDate: data.business.formationDate
            ? new Date(data.business.formationDate).toLocaleDateString()
            : new Date().toLocaleDateString(),
          ein: data.business.ein || "93-4327510",
          email: data.business.email || "",
          phone: data.business.phone || "",
          address: data.business.address || "",
          website: data.business.website || "",
          industry: data.business.industry || "",
          // For UI display - these would come from a different API in a real app
          serviceStatus: "Active",
          llcProgress: 70,
          llcStatusMessage: "LLC formation in progress",
        })
      } else {
        // Set default values if no business data exists
        setBusinessData({
          name: "Your Business LLC",
          businessId: "10724418",
          formationDate: new Date().toLocaleDateString(),
          ein: "93-4327510",
          email: "",
          phone: "",
          address: "",
          website: "",
          industry: "",
          serviceStatus: "Active",
          llcProgress: 70,
          llcStatusMessage: "LLC formation in progress",
        })
      }
    } catch (error) {
      console.error("Error fetching business data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-screen">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null // Will redirect to login
  }

  return (
    <div className="p-8 mb-40">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Hello, {session?.user?.name || "Client"}</h1>
        <p className="text-gray-600">All of us at Orizen wish you great success with {businessData.name}</p>
      </div>

      {/* Business Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center">
              <Flag className="w-5 h-5 text-[#22c984] mr-2" />
              <span className="text-sm text-gray-600">Business Name</span>
            </div>
            <Button variant="ghost" size="icon">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </Button>
          </div>
          <p className="text-lg font-semibold">{businessData.name}</p>
        </Card>

        <Card className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center">
              <Building2 className="w-5 h-5 text-[#22c984] mr-2" />
              <span className="text-sm text-gray-600">Business ID</span>
            </div>
            <Button variant="ghost" size="icon">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </Button>
          </div>
          <p className="text-lg font-semibold">{businessData.businessId}</p>
        </Card>

        <Card className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center">
              <Hash className="w-5 h-5 text-[#22c984] mr-2" />
              <span className="text-sm text-gray-600">EIN</span>
            </div>
            <Button variant="ghost" size="icon">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </Button>
          </div>
          <p className="text-lg font-semibold">{businessData.ein}</p>
        </Card>

        <Card className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center">
              <Bell className="w-5 h-5 text-[#22c984] mr-2" />
              <span className="text-sm text-gray-600">Service Status</span>
            </div>
            <Button variant="ghost" size="icon">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </Button>
          </div>
          <div className="flex items-center">
            <div
              className={`w-2 h-2 rounded-full ${
                businessData.serviceStatus === "Active"
                  ? "bg-green-500"
                  : businessData.serviceStatus === "Pending"
                    ? "bg-yellow-500"
                    : "bg-red-500"
              } mr-2`}
            ></div>
            <p className="text-lg font-semibold">{businessData.serviceStatus}</p>
          </div>
        </Card>
      </div>

      {/* Formation Date Card */}
      <Card className="mb-8 p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center">
            <Calendar className="w-5 h-5 text-[#22c984] mr-2" />
            <span className="text-sm text-gray-600">Formation Date</span>
          </div>
          <Button variant="ghost" size="icon">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </Button>
        </div>
        <p className="text-lg font-semibold">{businessData.formationDate}</p>
      </Card>

      {/* LLC Status Card */}
      <Card className="mb-8 p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-[#22c984] mr-2" />
            <span className="text-sm text-gray-600">LLC Status</span>
          </div>
          <Button variant="ghost" size="icon">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </Button>
        </div>
        <p className="text-md mb-2">{businessData.llcStatusMessage}</p>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${businessData.llcProgress >= 70 ? "bg-green-500" : "bg-blue-500"} ${
              businessData.llcProgress === 100 ? "flex items-center justify-end pr-1" : ""
            }`}
            style={{ width: `${businessData.llcProgress}%` }}
          >
            {businessData.llcProgress === 100 && <CheckCircle className="w-4 h-4 text-white" />}
          </div>
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>Application</span>
          <span>Processing</span>
          <span>Approval</span>
          <span>Filing</span>
          <span>Complete</span>
        </div>
      </Card>

      {/* Next Payment Card */}
      <Card className="mb-8 p-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-sm text-gray-600 mb-1">Next payment in</div>
            <div className="text-lg font-semibold">21 Mar 2025</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600 mb-1">227 days left</div>
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-[#22c984] rounded-full" style={{ width: "60%" }}></div>
            </div>
          </div>
        </div>
      </Card>

      {/* Address Section */}
      <Card className="mb-8 p-6">
        <div className="flex justify-between items-center mb-4">
          <p className="text-lg">{businessData.address || "100 Ambition Parkway, New York, NY 10001, USA"}</p>
          <Button variant="ghost" size="icon">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </Button>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Button variant="outline" className="flex items-center justify-between p-6 h-auto">
          <div className="flex items-center">
            <Download className="w-5 h-5 mr-2" />
            <span>Download your FREE company logos</span>
          </div>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </Button>

        <Button variant="outline" className="flex items-center justify-between p-6 h-auto">
          <div className="flex items-center">
            <Phone className="w-5 h-5 mr-2" />
            <span>Claim your FREE US phone number</span>
          </div>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>

      {/* Documents Section */}
      <Card className="mb-8">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Docs</h2>
        </div>
        <div className="p-6">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="pb-4">Type</th>
                <th className="pb-4">Date</th>
                <th className="pb-4">View</th>
                <th className="pb-4">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="py-4">Company documents</td>
                <td className="py-4">28 Mar 2024</td>
                <td className="py-4">
                  <Button variant="ghost" size="icon">
                    <Eye className="w-4 h-4" />
                  </Button>
                </td>
                <td className="py-4">
                  <Button variant="ghost" size="icon">
                    <Download className="w-4 w-4" />
                  </Button>
                </td>
              </tr>
              <tr>
                <td className="py-4">Scanned mail</td>
                <td className="py-4">04 Apr 2024</td>
                <td className="py-4">
                  <Button variant="ghost" size="icon">
                    <Eye className="w-4 h-4" />
                  </Button>
                </td>
                <td className="py-4">
                  <Button variant="ghost" size="icon">
                    <Download className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
              <tr>
                <td className="py-4">Scanned mail</td>
                <td className="py-4">24 May 2024</td>
                <td className="py-4">
                  <Button variant="ghost" size="icon">
                    <Eye className="w-4 h-4" />
                  </Button>
                </td>
                <td className="py-4">
                  <Button variant="ghost" size="icon">
                    <Download className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Help Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-r from-pink-500 to-purple-500 text-white">
          <div className="p-6">
            <h3 className="text-2xl font-bold mb-4">Get $20</h3>
            <p className="mb-6">
              Earn rewards by referring your friends to experience our services. Unlock exclusive benefits when you
              partner with Orizen!
            </p>
            <Button variant="secondary" className="bg-white text-purple-600 hover:bg-gray-100">
              Claim
            </Button>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-2xl font-bold mb-6">Need help?</h3>
            <div className="space-y-4">
              <Button variant="outline" className="w-full justify-start h-auto py-4">
                <User className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <p className="font-semibold">Contact account manager</p>
                  <p className="text-sm text-gray-600">Steve is your Orizen account manager.</p>
                </div>
              </Button>

              <Button variant="outline" className="w-full justify-start h-auto py-4">
                <MessageSquare className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <p className="font-semibold">Create a ticket</p>
                  <p className="text-sm text-gray-600">Our support team is always here for you.</p>
                </div>
              </Button>

              <Button variant="outline" className="w-full justify-start h-auto py-4">
                <FileText className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <p className="font-semibold">Read our Helpdesk articles</p>
                  <p className="text-sm text-gray-600">We have content that you might be interested in.</p>
                </div>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

