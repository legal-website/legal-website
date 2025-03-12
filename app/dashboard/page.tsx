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
  Copy,
} from "lucide-react"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [businessData, setBusinessData] = useState({
    name: "",
    businessId: "",
    formationDate: "",
    ein: "",
    serviceStatus: "Pending",
    llcStatus: "In Progress",
    llcProgress: 0,
    llcStatusMessage: "LLC formation initiated",
  })

  useEffect(() => {
    // Redirect to login if not authenticated
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchBusinessData()
    } else {
      setLoading(false)
    }
  }, [session])

  const fetchBusinessData = async () => {
    try {
      const response = await fetch("/api/user/business")
      if (response.ok) {
        const data = await response.json()
        if (data.business) {
          setBusinessData({
            name: data.business.name || "Your Business LLC",
            businessId: data.business.businessId || "Pending",
            formationDate: data.business.formationDate
              ? new Date(data.business.formationDate).toLocaleDateString()
              : "Pending",
            ein: data.business.ein || "Pending",
            serviceStatus: data.business.serviceStatus || "Pending",
            llcStatus: data.business.llcStatus || "In Progress",
            llcProgress: data.business.llcProgress || 0,
            llcStatusMessage: data.business.llcStatusMessage || "LLC formation initiated",
          })
        }
      }
    } catch (error) {
      console.error("Error fetching business data:", error)
    } finally {
      setLoading(false)
    }
  }

  const userName = session?.user?.name || "Client"

  // Function to determine the color of the progress bar
  const getProgressBarColor = (progress: number) => {
    if (progress >= 100) return "bg-green-500"
    if (progress >= 70) return "bg-green-400"
    return "bg-blue-500"
  }

  // Function to determine the status icon
  const getStatusIcon = (progress: number) => {
    if (progress >= 100) return <CheckCircle className="h-5 w-5 text-green-500" />
    return null
  }

  // Function to copy text to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast({
          title: "Copied!",
          description: `${label} copied to clipboard`,
        })
      },
      (err) => {
        console.error("Could not copy text: ", err)
        toast({
          title: "Error",
          description: "Failed to copy to clipboard",
          variant: "destructive",
        })
      },
    )
  }

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="p-8 mb-40">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Hello, {userName}</h1>
        <p className="text-gray-600">All of us at Orizen wish you great success with {businessData.name}</p>
      </div>

      {/* Business Information Cards - 5 columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center">
              <Flag className="w-5 h-5 text-[#22c984] mr-2" />
              <span className="text-sm text-gray-600">Business Name</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => copyToClipboard(businessData.name, "Business name")}>
              <Copy className="w-4 h-4" />
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
            <Button variant="ghost" size="icon" onClick={() => copyToClipboard(businessData.businessId, "Business ID")}>
              <Copy className="w-4 h-4" />
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
            <Button variant="ghost" size="icon" onClick={() => copyToClipboard(businessData.ein, "EIN")}>
              <Copy className="w-4 h-4" />
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => copyToClipboard(businessData.serviceStatus, "Service status")}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center">
            <div
              className={`w-2 h-2 rounded-full ${
                businessData.serviceStatus === "Approved"
                  ? "bg-green-500"
                  : businessData.serviceStatus === "Pending"
                    ? "bg-yellow-500"
                    : "bg-red-500"
              } mr-2`}
            ></div>
            <p className="text-lg font-semibold">{businessData.serviceStatus}</p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-[#22c984] mr-2" />
              <span className="text-sm text-gray-600">Formation Date</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => copyToClipboard(businessData.formationDate, "Formation date")}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-lg font-semibold">{businessData.formationDate}</p>
        </Card>
      </div>

      {/* LLC Status Card */}
      <Card className="mb-8 p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center">
            <Building2 className="w-5 h-5 text-[#22c984] mr-2" />
            <span className="text-sm text-gray-600">LLC Status</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => copyToClipboard(businessData.llcStatusMessage, "LLC status")}
          >
            <Copy className="w-4 h-4" />
          </Button>
        </div>
        <div className="mb-2 flex items-center">
          <p className="text-lg font-semibold mr-2">{businessData.llcStatusMessage}</p>
          {getStatusIcon(businessData.llcProgress)}
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${getProgressBarColor(businessData.llcProgress)} rounded-full`}
            style={{ width: `${businessData.llcProgress}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-500 mt-1">{businessData.llcProgress}% Complete</p>
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
          <p className="text-lg">100 Ambition Parkway, New York, NY 10001, USA</p>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => copyToClipboard("100 Ambition Parkway, New York, NY 10001, USA", "Address")}
          >
            <Copy className="w-4 h-4" />
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
                    <Download className="w-4 h-4" />
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

