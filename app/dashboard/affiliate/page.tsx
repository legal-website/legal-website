"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Copy,
  DollarSign,
  Link,
  Share2,
  Users,
  UserPlus,
  MessageSquare,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  X,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { generateReferralLink, formatCurrency, formatDate, calculateProgress } from "@/lib/affiliate"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Area,
} from "recharts"
import { ChartContainer } from "@/components/ui/chart"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

interface PayoutFormData {
  method: string
  fullName: string
  // Bank transfer fields
  bankName?: string
  accountNumber?: string
  iban?: string
  swiftCode?: string
  branchAddress?: string
  // PayPal fields
  email?: string
  // Mobile payment fields
  mobileNumber?: string
  serviceProvider?: string
  cnic?: string
  // Common fields
  additionalInfo?: string
}

export default function AffiliateProgramPage() {
  const [copied, setCopied] = useState(false)
  const [showFAQItem, setShowFAQItem] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [affiliateData, setAffiliateData] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const { toast } = useToast()

  const [earningsChartData, setEarningsChartData] = useState<any[]>([])
  const [clicksChartData, setClicksChartData] = useState<any[]>([])
  const [earningsPeriod, setEarningsPeriod] = useState("6months")
  const [clicksPeriod, setClicksPeriod] = useState("30days")
  const [earningsLoading, setEarningsLoading] = useState(false)
  const [clicksLoading, setClicksLoading] = useState(false)
  const [visibleReferrals, setVisibleReferrals] = useState(4)

  // Add these new state variables after the existing state declarations
  const [dismissedRejections, setDismissedRejections] = useState<string[]>([])
  const [payoutsPage, setPayoutsPage] = useState(1)
  const [earningsPage, setEarningsPage] = useState(1)
  const ITEMS_PER_PAGE = 5

  // Payout dialog state
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false)
  const [payoutFormData, setPayoutFormData] = useState<PayoutFormData>({
    method: "bank",
    fullName: "",
    bankName: "",
    accountNumber: "",
    iban: "",
    swiftCode: "",
    branchAddress: "",
    email: "",
    mobileNumber: "",
    serviceProvider: "",
    cnic: "",
    additionalInfo: "",
  })
  const [payoutSubmitting, setPayoutSubmitting] = useState(false)

  // First, add new state variables for the field review feature
  // Add these after the existing state declarations, around line 80

  const [reviewingField, setReviewingField] = useState<string | null>(null)
  const [reviewComplete, setReviewComplete] = useState(false)
  const reviewFields = [
    { id: "fullName", label: "Full Name" },
    { id: "method", label: "Payment Method" },
    // Bank fields
    { id: "bankName", label: "Bank Name", condition: () => payoutFormData.method === "bank" },
    { id: "accountNumber", label: "Account Number", condition: () => payoutFormData.method === "bank" },
    { id: "iban", label: "IBAN", condition: () => payoutFormData.method === "bank" },
    // PayPal fields
    { id: "email", label: "PayPal Email", condition: () => payoutFormData.method === "paypal" },
    // Mobile payment fields
    { id: "serviceProvider", label: "Service Provider", condition: () => payoutFormData.method === "mobile" },
    { id: "mobileNumber", label: "Mobile Number", condition: () => payoutFormData.method === "mobile" },
  ]

  const fetchEarningsChartData = async (period: string) => {
    try {
      setEarningsLoading(true)
      const res = await fetch(`/api/affiliate/chart-data?type=earnings&period=${period}`)
      const data = await res.json()

      if (data.data) {
        setEarningsChartData(data.data)
      }
      setEarningsLoading(false)
    } catch (error) {
      console.error("Error fetching earnings chart data:", error)
      setEarningsLoading(false)
    }
  }

  const fetchClicksChartData = async (period: string) => {
    try {
      setClicksLoading(true)
      const res = await fetch(`/api/affiliate/chart-data?type=clicks&period=${period}`)
      const data = await res.json()

      if (data.data) {
        setClicksChartData(data.data)
      }
      setClicksLoading(false)
    } catch (error) {
      console.error("Error fetching clicks chart data:", error)
      setClicksLoading(false)
    }
  }

  useEffect(() => {
    const fetchAffiliateData = async () => {
      try {
        // Fetch affiliate link
        const linkRes = await fetch("/api/affiliate/link")
        const linkData = await linkRes.json()

        if (linkData.link) {
          setAffiliateData(linkData.link)
        }

        // Fetch affiliate stats
        const statsRes = await fetch("/api/affiliate/stats")
        const statsData = await statsRes.json()
        setStats(statsData)

        // Fetch initial chart data
        fetchEarningsChartData(earningsPeriod)
        fetchClicksChartData(clicksPeriod)

        setLoading(false)
      } catch (error) {
        console.error("Error fetching affiliate data:", error)
        setLoading(false)
      }
    }

    fetchAffiliateData()
  }, [])

  // Fetch chart data when period changes
  useEffect(() => {
    if (!loading) {
      fetchEarningsChartData(earningsPeriod)
    }
  }, [earningsPeriod, loading])

  useEffect(() => {
    if (!loading) {
      fetchClicksChartData(clicksPeriod)
    }
  }, [clicksPeriod, loading])

  // Add this useEffect to load dismissed notifications from localStorage
  useEffect(() => {
    // Load dismissed notifications from localStorage
    const savedDismissals = localStorage.getItem("dismissedRejections")
    if (savedDismissals) {
      setDismissedRejections(JSON.parse(savedDismissals))
    }
  }, [])

  // Add a useEffect to handle the field review process when the dialog opens
  // Add this after the other useEffect hooks

  useEffect(() => {
    if (payoutDialogOpen && !reviewComplete) {
      let currentIndex = 0

      const reviewNextField = () => {
        // Find the next applicable field based on payment method
        while (
          currentIndex < reviewFields.length &&
          reviewFields[currentIndex].condition !== undefined &&
          !reviewFields[currentIndex].condition?.()
        ) {
          currentIndex++
        }

        if (currentIndex < reviewFields.length) {
          setReviewingField(reviewFields[currentIndex].id)
          currentIndex++
          setTimeout(reviewNextField, 5000) // Move to next field after 5 seconds
        } else {
          setReviewingField(null)
          setReviewComplete(true)
        }
      }

      // Start the review process
      reviewNextField()

      return () => {
        // Reset when dialog closes
        setReviewingField(null)
        setReviewComplete(false)
      }
    }
  }, [payoutDialogOpen, payoutFormData.method])

  const referralLink = affiliateData ? generateReferralLink(affiliateData.code) : ""

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    toast({
      title: "Link copied!",
      description: "Your referral link has been copied to clipboard.",
    })
    setTimeout(() => setCopied(false), 2000)
  }

  const toggleFAQItem = (index: number) => {
    setShowFAQItem(showFAQItem === index ? null : index)
  }

  const shareToSocial = (platform: string) => {
    let url = ""

    switch (platform) {
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`
        break
      case "twitter":
        url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent("Join me on Legal Website! Use my referral link:")}`
        break
      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`
        break
      default:
        return
    }

    window.open(url, "_blank", "width=600,height=400")
  }

  const handlePayoutFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setPayoutFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const requestPayout = async () => {
    try {
      setPayoutDialogOpen(true)
    } catch (error) {
      console.error("Error opening payout dialog:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    }
  }

  // Add this function to handle dismissing rejected payout notifications
  const dismissRejection = (payoutId: string) => {
    const updatedDismissals = [...dismissedRejections, payoutId]
    setDismissedRejections(updatedDismissals)
    localStorage.setItem("dismissedRejections", JSON.stringify(updatedDismissals))
  }

  const submitPayoutRequest = async () => {
    try {
      setPayoutSubmitting(true)

      // Validate form data
      if (!payoutFormData.fullName) {
        toast({
          title: "Missing information",
          description: "Please enter your full name.",
          variant: "destructive",
        })
        setPayoutSubmitting(false)
        return
      }

      if (payoutFormData.method === "bank" && (!payoutFormData.bankName || !payoutFormData.accountNumber)) {
        toast({
          title: "Missing information",
          description: "Please fill in all required bank details.",
          variant: "destructive",
        })
        setPayoutSubmitting(false)
        return
      }

      if (payoutFormData.method === "paypal") {
        if (!payoutFormData.email) {
          toast({
            title: "Missing information",
            description: "Please enter your PayPal email address.",
            variant: "destructive",
          })
          setPayoutSubmitting(false)
          return
        }

        // Add email format validation
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        if (!emailRegex.test(payoutFormData.email)) {
          toast({
            title: "Invalid email",
            description: "Please enter a valid email address.",
            variant: "destructive",
          })
          setPayoutSubmitting(false)
          return
        }
      }

      if (payoutFormData.method === "mobile") {
        if (!payoutFormData.mobileNumber || !payoutFormData.serviceProvider) {
          toast({
            title: "Missing information",
            description: "Please fill in all required mobile payment details.",
            variant: "destructive",
          })
          setPayoutSubmitting(false)
          return
        }

        if (payoutFormData.mobileNumber.length !== 11) {
          toast({
            title: "Invalid mobile number",
            description: "Mobile number must be exactly 11 digits.",
            variant: "destructive",
          })
          setPayoutSubmitting(false)
          return
        }
      }

      const payoutAmount = stats?.pendingEarnings || 0

      if (payoutAmount <= 0) {
        toast({
          title: "Invalid amount",
          description: "Please enter a valid amount greater than 0.",
          variant: "destructive",
        })
        setPayoutSubmitting(false)
        return
      }

      if (payoutAmount > (stats?.pendingEarnings || 0)) {
        toast({
          title: "Insufficient balance",
          description: "The requested amount exceeds your available balance.",
          variant: "destructive",
        })
        setPayoutSubmitting(false)
        return
      }

      const res = await fetch("/api/affiliate/payout/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...payoutFormData }),
      })

      const data = await res.json()

      if (res.ok) {
        toast({
          title: "Payout requested!",
          description: "Your payout request has been submitted successfully.",
        })

        // Refresh stats
        const statsRes = await fetch("/api/affiliate/stats")
        const statsData = await statsRes.json()
        setStats(statsData)

        // Close dialog and reset form
        setPayoutDialogOpen(false)
        setPayoutFormData({
          method: "bank",
          fullName: "",
          bankName: "",
          accountNumber: "",
          iban: "",
          swiftCode: "",
          branchAddress: "",
          email: "",
          mobileNumber: "",
          serviceProvider: "",
          cnic: "",
          additionalInfo: "",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to request payout.",
          variant: "destructive",
        })
      }
      setPayoutSubmitting(false)
    } catch (error) {
      console.error("Error requesting payout:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
      setPayoutSubmitting(false)
    }
  }

  const loadMoreReferrals = () => {
    setVisibleReferrals((prev) => prev + 4)
  }

  const faqItems = [
    {
      question: "How does the affiliate program work?",
      answer:
        "Our affiliate program allows you to earn commissions by referring new customers to our services. You'll receive a unique referral link to share, and when someone signs up using your link, you'll earn a commission on their purchases.",
    },
    {
      question: "How much can I earn?",
      answer: `You can earn ${stats?.settings?.commissionRate || 10}% commission on all purchases made by users you refer. There's no limit to how much you can earn, and commissions are paid out monthly.`,
    },
    {
      question: "When do I get paid?",
      answer: `Commissions are calculated at the end of each month and paid out by the 15th of the following month. You need a minimum balance of $${stats?.settings?.minPayoutAmount || 50} to receive a payout.`,
    },
    {
      question: "How long do referral cookies last?",
      answer: `Our referral cookies last for ${stats?.settings?.cookieDuration || 30} days. This means if someone clicks your link but doesn't sign up immediately, you'll still get credit if they return and sign up within ${stats?.settings?.cookieDuration || 30} days.`,
    },
  ]

  if (loading) {
    return (
      <div className="p-8 mb-40">
        <h1 className="text-3xl font-bold mb-6">Affiliate Program</h1>
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {[1, 2, 3].map((i) => (
            <Card className="p-6" key={i}>
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-6 w-32" />
              </div>
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-4 w-32" />
            </Card>
          ))}
        </div>
        <Card className="mb-8">
          <div className="p-6 border-b">
            <Skeleton className="h-6 w-40" />
          </div>
          <div className="p-6">
            <Skeleton className="h-4 w-full mb-4" />
            <Skeleton className="h-10 w-full mb-4" />
            <div className="grid md:grid-cols-3 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 mb-20 md:mb-40 overflow-x-hidden">
      <h1 className="text-3xl font-bold mb-6">Affiliate Program</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8 mb-8">
        {/* Earnings Card */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Total Earnings</h3>
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold mb-2">{formatCurrency(stats?.totalEarnings || 0)}</p>
          <p className="text-sm text-gray-500">
            {stats?.pendingEarnings > 0 ? `+${formatCurrency(stats?.pendingEarnings)} pending` : "No pending earnings"}
          </p>
        </Card>

        {/* Referrals Card */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Total Referrals</h3>
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold mb-2">{stats?.totalReferrals || 0}</p>
          <p className="text-sm text-gray-500">{stats?.recentReferrals?.length || 0} active in the last 30 days</p>
        </Card>

        {/* Conversion Rate Card */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <UserPlus className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Conversion Rate</h3>
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold mb-2">{stats?.conversionRate?.toFixed(1) || 0}%</p>
          <p className="text-sm text-gray-500">{stats?.totalClicks || 0} link clicks</p>
        </Card>
      </div>

      {/* Referral Link Section */}
      <Card className="mb-8">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Your Referral Link</h2>
        </div>
        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Share this unique link with your network. When someone signs up using your link, you&apos;ll earn{" "}
              {stats?.settings?.commissionRate || 10}% commission on their purchases.
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <div className="relative w-full">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Link className="h-4 w-4 text-gray-400" />
                </div>
                <Input value={referralLink} className="pl-9 pr-16 sm:pr-24 text-sm truncate" readOnly />
                <Button className="absolute right-1 top-1/2 -translate-y-1/2 h-8" size="sm" onClick={copyToClipboard}>
                  {copied ? "Copied!" : "Copy"}
                  <Copy className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
              <Button variant="outline" className="w-full sm:w-auto mt-2 sm:mt-0">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
            <Button
              variant="outline"
              className="flex items-center justify-center gap-2"
              onClick={() => shareToSocial("facebook")}
            >
              <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </Button>
            <Button
              variant="outline"
              className="flex items-center justify-center gap-2"
              onClick={() => shareToSocial("twitter")}
            >
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
              </svg>
              Twitter
            </Button>
            <Button
              variant="outline"
              className="flex items-center justify-center gap-2"
              onClick={() => shareToSocial("linkedin")}
            >
              <svg className="h-5 w-5 text-blue-700" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              LinkedIn
            </Button>
          </div>
        </div>
      </Card>

      {/* Performance Tabs */}
      <Card className="mb-8">
        <Tabs defaultValue="earnings">
          <div className="p-6 border-b">
            <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-4">
              <h2 className="text-xl font-semibold">Performance</h2>
              <TabsList>
                <TabsTrigger value="earnings">Earnings</TabsTrigger>
                <TabsTrigger value="referrals">Referrals</TabsTrigger>
                <TabsTrigger value="clicks">Clicks</TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="earnings" className="p-6">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">Earnings Over Time</h3>
                <Select value={earningsPeriod} onValueChange={setEarningsPeriod}>
                  <SelectTrigger className="text-sm border rounded-md px-2 py-1 h-8 w-[140px]">
                    <SelectValue placeholder="Last 6 months" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30days">Last 30 days</SelectItem>
                    <SelectItem value="90days">Last 90 days</SelectItem>
                    <SelectItem value="6months">Last 6 months</SelectItem>
                    <SelectItem value="1year">Last year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="h-[250px] sm:h-[300px] md:h-[350px] bg-gray-50 rounded-lg overflow-hidden">
                {earningsLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Skeleton className="h-[90%] w-[95%] rounded-lg" />
                  </div>
                ) : earningsChartData.length > 0 ? (
                  <ChartContainer
                    config={{
                      amount: {
                        label: "Daily Earnings",
                        color: "hsl(142, 76%, 36%)",
                      },
                    }}
                    className="h-full w-full"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={earningsChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <defs>
                          <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="hsl(var(--border))"
                          opacity={0.3}
                        />
                        <XAxis
                          dataKey="date"
                          axisLine={false}
                          tickLine={false}
                          tickMargin={10}
                          stroke="hsl(var(--muted-foreground))"
                          tickFormatter={(value) => {
                            const date = new Date(value)
                            return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                          }}
                          minTickGap={30}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(value) => `$${value}`}
                          tickMargin={10}
                          stroke="hsl(var(--muted-foreground))"
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload
                              return (
                                <div className="rounded-lg border bg-background p-3 shadow-md">
                                  <div className="grid gap-2">
                                    <div className="flex flex-col">
                                      <span className="text-[0.70rem] uppercase text-muted-foreground">Date</span>
                                      <span className="font-bold text-foreground">
                                        {new Date(data.date).toLocaleDateString("en-US", {
                                          weekday: "long",
                                          year: "numeric",
                                          month: "long",
                                          day: "numeric",
                                        })}
                                      </span>
                                    </div>
                                    <div className="flex flex-col">
                                      <span
                                        className="text-[0.70rem] uppercase"
                                        style={{ color: "var(--color-amount)" }}
                                      >
                                        Earnings
                                      </span>
                                      <span className="font-bold text-lg" style={{ color: "var(--color-amount)" }}>
                                        ${Number(data.amount).toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )
                            }
                            return null
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="amount"
                          stroke="var(--color-amount)"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorAmount)"
                        />
                        <Line
                          type="monotone"
                          dataKey="amount"
                          stroke="var(--color-amount)"
                          strokeWidth={2}
                          dot={{ r: 3, strokeWidth: 2, fill: "white", stroke: "var(--color-amount)" }}
                          activeDot={{ r: 6, strokeWidth: 0, fill: "var(--color-amount)" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    No earnings data available
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-4">Recent Earnings</h3>
              {stats?.recentEarnings?.length > 0 ? (
                <>
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <div className="min-w-full inline-block align-middle px-4 sm:px-0">
                      <div className="overflow-hidden">
                        <table className="min-w-full">
                          <thead>
                            <tr className="text-left border-b">
                              <th className="pb-3 font-medium">Date</th>
                              <th className="pb-3 font-medium">Order ID</th>
                              <th className="pb-3 font-medium">Purchase Amount</th>
                              <th className="pb-3 font-medium">Commission</th>
                              <th className="pb-3 font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {stats.recentEarnings
                              .slice((earningsPage - 1) * ITEMS_PER_PAGE, earningsPage * ITEMS_PER_PAGE)
                              .map((earning: any) => (
                                <tr key={earning.id}>
                                  <td className="py-3 px-2 sm:px-3">{formatDate(earning.createdAt)}</td>
                                  <td className="py-3 px-2 sm:px-3">{earning.orderId}</td>
                                  <td className="py-3 px-2 sm:px-3">{formatCurrency(Number(earning.amount))}</td>
                                  <td className="py-3 px-2 sm:px-3 font-medium">
                                    {formatCurrency(Number(earning.commission))}
                                  </td>
                                  <td className="py-3 px-2 sm:px-3">
                                    <span
                                      className={`text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full whitespace-nowrap ${
                                        earning.status === "PAID"
                                          ? "bg-green-100 text-green-800"
                                          : earning.status === "APPROVED"
                                            ? "bg-blue-100 text-blue-800"
                                            : earning.status === "PENDING"
                                              ? "bg-yellow-100 text-yellow-800"
                                              : "bg-red-100 text-red-800"
                                      }`}
                                    >
                                      {earning.status.charAt(0) + earning.status.slice(1).toLowerCase()}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                  {stats.recentEarnings.length > ITEMS_PER_PAGE && (
                    <div className="flex justify-center mt-4">
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEarningsPage((p) => Math.max(1, p - 1))}
                          disabled={earningsPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span className="sr-only">Previous</span>
                        </Button>
                        <span className="text-sm">
                          Page {earningsPage} of {Math.ceil(stats.recentEarnings.length / ITEMS_PER_PAGE)}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setEarningsPage((p) =>
                              Math.min(Math.ceil(stats.recentEarnings.length / ITEMS_PER_PAGE), p + 1),
                            )
                          }
                          disabled={earningsPage === Math.ceil(stats.recentEarnings.length / ITEMS_PER_PAGE)}
                        >
                          <ChevronRight className="h-4 w-4" />
                          <span className="sr-only">Next</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No earnings yet</AlertTitle>
                  <AlertDescription>Start sharing your referral link to earn commissions.</AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>

          <TabsContent value="referrals" className="p-6">
            <div className="mb-6">
              <h3 className="font-medium mb-4">Your Referrals</h3>
              {stats?.recentReferrals?.length > 0 ? (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="min-w-full inline-block align-middle px-4 sm:px-0">
                    <div className="overflow-hidden">
                      <table className="min-w-full">
                        <thead>
                          <tr className="text-left border-b">
                            <th className="pb-3 font-medium">Order ID</th>
                            <th className="pb-3 font-medium">Date Joined</th>
                            <th className="pb-3 font-medium">Total Spent</th>
                            <th className="pb-3 font-medium">Your Commission</th>
                            <th className="pb-3 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {stats.recentReferrals.slice(0, visibleReferrals).map((referral: any) => (
                            <tr key={referral.id}>
                              <td className="py-3 px-2 sm:px-3">
                                <div>
                                  <p className="font-medium">{referral.orderId}</p>
                                </div>
                              </td>
                              <td className="py-3 px-2 sm:px-3">{formatDate(referral.createdAt)}</td>
                              <td className="py-3 px-2 sm:px-3">{formatCurrency(Number(referral.amount))}</td>
                              <td className="py-3 px-2 sm:px-3 font-medium">
                                {formatCurrency(Number(referral.commission))}
                              </td>
                              <td className="py-3 px-2 sm:px-3">
                                <span
                                  className={`text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full whitespace-nowrap ${
                                    referral.status === "PAID"
                                      ? "bg-green-100 text-green-800"
                                      : referral.status === "APPROVED"
                                        ? "bg-blue-100 text-blue-800"
                                        : referral.status === "PENDING"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {referral.status.charAt(0) + referral.status.slice(1).toLowerCase()}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No referrals yet</AlertTitle>
                  <AlertDescription>Share your referral link to start earning commissions.</AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>

          <TabsContent value="clicks" className="p-6">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">Link Clicks</h3>
                <Select value={clicksPeriod} onValueChange={setClicksPeriod}>
                  <SelectTrigger className="text-sm border rounded-md px-2 py-1 h-8 w-[140px]">
                    <SelectValue placeholder="Last 30 days" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30days">Last 30 days</SelectItem>
                    <SelectItem value="90days">Last 90 days</SelectItem>
                    <SelectItem value="6months">Last 6 months</SelectItem>
                    <SelectItem value="1year">Last year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="h-[250px] sm:h-[300px] md:h-[350px] bg-gray-50 rounded-lg overflow-hidden">
                {clicksLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Skeleton className="h-[90%] w-[95%] rounded-lg" />
                  </div>
                ) : clicksChartData.length > 0 ? (
                  <ChartContainer
                    config={{
                      clicks: {
                        label: "Daily Clicks",
                        color: "hsl(226, 70%, 55%)",
                      },
                    }}
                    className="h-full w-full"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={clicksChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="date"
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(value) => {
                            const date = new Date(value)
                            return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                          }}
                          tickMargin={10}
                          stroke="hsl(var(--muted-foreground))"
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          allowDecimals={false}
                          tickMargin={10}
                          stroke="hsl(var(--muted-foreground))"
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload
                              return (
                                <div className="rounded-lg border bg-background p-3 shadow-md">
                                  <div className="grid gap-2">
                                    <div className="flex flex-col">
                                      <span className="text-[0.70rem] uppercase text-muted-foreground">Date</span>
                                      <span className="font-bold text-foreground">
                                        {new Date(data.date).toLocaleDateString("en-US", {
                                          weekday: "long",
                                          year: "numeric",
                                          month: "long",
                                          day: "numeric",
                                        })}
                                      </span>
                                    </div>
                                    <div className="flex flex-col">
                                      <span
                                        className="text-[0.70rem] uppercase"
                                        style={{ color: "var(--color-clicks)" }}
                                      >
                                        Clicks
                                      </span>
                                      <span className="font-bold text-lg" style={{ color: "var(--color-clicks)" }}>
                                        {data.clicks}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )
                            }
                            return null
                          }}
                        />
                        <Bar dataKey="clicks" fill="var(--color-clicks)" radius={[4, 4, 0, 0]} name="clicks" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">No click data available</div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-4">Click Statistics</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Total Clicks</p>
                  <p className="text-2xl font-bold">{stats?.totalClicks || 0}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Conversion Rate</p>
                  <p className="text-2xl font-bold">{stats?.conversionRate?.toFixed(1) || 0}%</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Avg. Commission</p>
                  <p className="text-2xl font-bold">
                    {stats?.totalReferrals > 0
                      ? formatCurrency(stats.totalEarnings / stats.totalReferrals)
                      : formatCurrency(0)}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Payout Information */}
      <Card className="mb-8">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Payout Information</h2>
        </div>
        <div className="p-6">
          {stats?.rejectedPayouts && stats.rejectedPayouts.length > 0 && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h4 className="font-medium text-amber-800 mb-2">Rejected Payout Requests</h4>
              {stats.rejectedPayouts
                .filter((payout: any) => !dismissedRejections.includes(payout.id))
                .map((payout: any, index: number) => (
                  <div key={index} className="mb-2 last:mb-0 pb-2 last:pb-0 border-b last:border-b-0 border-amber-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium">{formatCurrency(Number(payout.amount))}</p>
                        <p className="text-xs text-gray-600">{formatDate(payout.updatedAt)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                          Rejected
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => dismissRejection(payout.id)}
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Dismiss</span>
                        </Button>
                      </div>
                    </div>
                    {payout.notes && (
                      <div className="mt-1 text-xs text-amber-800">
                        <p className="font-medium">Admin Notes:</p>
                        <p>{payout.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-medium">Current Balance</h3>
                <p className="text-2xl font-bold">{formatCurrency(stats?.pendingEarnings || 0)}</p>
              </div>
              <Button
                onClick={requestPayout}
                disabled={!stats?.pendingEarnings || stats.pendingEarnings < (stats?.settings?.minPayoutAmount || 50)}
              >
                Request Payout
              </Button>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm font-medium">Progress to next payout</p>
                <p className="text-xs text-gray-500">(${stats?.settings?.minPayoutAmount || 50} minimum)</p>
              </div>
              <div className="mb-2">
                <Progress
                  value={calculateProgress(stats?.pendingEarnings || 0, stats?.settings?.minPayoutAmount || 50)}
                  className="h-2"
                />
              </div>
              <p className="text-xs text-gray-500">
                {stats?.pendingEarnings >= (stats?.settings?.minPayoutAmount || 50)
                  ? "You've reached the minimum payout threshold"
                  : `$${(stats?.settings?.minPayoutAmount || 50) - (stats?.pendingEarnings || 0)} more needed to reach minimum payout`}
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-4">Payout History</h3>
            {stats?.payouts?.length > 0 ? (
              <>
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="min-w-full inline-block align-middle px-4 sm:px-0">
                    <div className="overflow-hidden">
                      <table className="min-w-full">
                        <thead>
                          <tr className="text-left border-b">
                            <th className="pb-3 font-medium">Date</th>
                            <th className="pb-3 font-medium">Amount</th>
                            <th className="pb-3 font-medium">Method</th>
                            <th className="pb-3 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {stats.payouts
                            .slice((payoutsPage - 1) * ITEMS_PER_PAGE, payoutsPage * ITEMS_PER_PAGE)
                            .map((payout: any) => (
                              <tr key={payout.id}>
                                <td className="py-3 px-2 sm:px-3">{formatDate(payout.createdAt)}</td>
                                <td className="py-3 px-2 sm:px-3 font-medium">
                                  {formatCurrency(Number(payout.amount))}
                                </td>
                                <td className="py-3 px-2 sm:px-3">{payout.method}</td>
                                <td className="py-3 px-2 sm:px-3">
                                  <span
                                    className={`text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full whitespace-nowrap ${
                                      payout.status === "COMPLETED"
                                        ? "bg-green-100 text-green-800"
                                        : payout.status === "PENDING"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : payout.status === "IN_PROGRESS"
                                            ? "bg-blue-100 text-blue-800"
                                            : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {payout.status === "IN_PROGRESS"
                                      ? "In Progress"
                                      : payout.status.charAt(0) + payout.status.slice(1).toLowerCase()}
                                  </span>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                {stats.payouts.length > ITEMS_PER_PAGE && (
                  <div className="flex justify-center mt-4">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPayoutsPage((p) => Math.max(1, p - 1))}
                        disabled={payoutsPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Previous</span>
                      </Button>
                      <span className="text-sm">
                        Page {payoutsPage} of {Math.ceil(stats.payouts.length / ITEMS_PER_PAGE)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPayoutsPage((p) => Math.min(Math.ceil(stats.payouts.length / ITEMS_PER_PAGE), p + 1))
                        }
                        disabled={payoutsPage === Math.ceil(stats.payouts.length / ITEMS_PER_PAGE)}
                      >
                        <ChevronRight className="h-4 w-4" />
                        <span className="sr-only">Next</span>
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No payout history</AlertTitle>
                <AlertDescription>
                  Your payout history will appear here once you've requested a payout.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </Card>

      {/* FAQ Section */}
      <Card>
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Frequently Asked Questions</h2>
        </div>
        <div className="p-6">
          <div className="space-y-2 sm:space-y-4">
            {faqItems.map((item, index) => (
              <div key={index} className="border rounded-lg overflow-hidden">
                <button
                  className="flex items-center justify-between w-full p-4 text-left font-medium"
                  onClick={() => toggleFAQItem(index)}
                >
                  {item.question}
                  {showFAQItem === index ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </button>
                {showFAQItem === index && (
                  <div className="p-4 bg-gray-50 border-t">
                    <p className="text-gray-600">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-600 mb-4">Have more questions about our affiliate program?</p>
            <Button>
              <MessageSquare className="mr-2 h-4 w-4" />
              Contact Support
            </Button>
          </div>
        </div>
      </Card>

      {/* Payout Request Dialog */}
      <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
        <DialogContent className="w-[calc(100%-32px)] sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Request Payout</DialogTitle>
            <DialogDescription>
              Please provide your payment details. Fields marked with <span className="text-red-500">*</span> are
              required.
            </DialogDescription>
          </DialogHeader>

          {!reviewComplete && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Please review your information carefully</AlertTitle>
              <AlertDescription>
                Each field will be highlighted for 5 seconds. Please verify all your account details before submitting.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-3 sm:gap-4 py-2 sm:py-4">
            <div className="grid gap-2">
              <div className="flex justify-between items-center">
                <Label>Available Balance</Label>
                <span className="font-medium">{formatCurrency(stats?.pendingEarnings || 0)}</span>
              </div>
            </div>

            <div className="grid gap-2">
              <Label
                htmlFor="method"
                className={reviewingField === "method" ? "text-primary font-bold animate-pulse" : ""}
              >
                Payment Method <span className="text-red-500">*</span>
                {reviewingField === "method" && (
                  <span className="ml-2 text-sm text-primary">← Please verify this information</span>
                )}
              </Label>
              <Select
                name="method"
                value={payoutFormData.method}
                onValueChange={(value) => {
                  setPayoutFormData((prev) => ({ ...prev, method: value }))
                  // Reset review process when payment method changes
                  setReviewComplete(false)
                }}
              >
                <SelectTrigger className={reviewingField === "method" ? "border-primary border-2" : ""}>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="mobile">Mobile Payment (Easypaisa/JazzCash/NayaPay)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label
                htmlFor="fullName"
                className={reviewingField === "fullName" ? "text-primary font-bold animate-pulse" : ""}
              >
                Full Name <span className="text-red-500">*</span>
                {reviewingField === "fullName" && (
                  <span className="ml-2 text-sm text-primary">← Please verify this information</span>
                )}
              </Label>
              <Input
                id="fullName"
                name="fullName"
                value={payoutFormData.fullName}
                onChange={handlePayoutFormChange}
                placeholder="John Doe"
                required
                className={reviewingField === "fullName" ? "border-primary border-2" : ""}
              />
            </div>

            {payoutFormData.method === "bank" && (
              <>
                <div className="grid gap-2">
                  <Label
                    htmlFor="bankName"
                    className={reviewingField === "bankName" ? "text-primary font-bold animate-pulse" : ""}
                  >
                    Bank Name <span className="text-red-500">*</span>
                    {reviewingField === "bankName" && (
                      <span className="ml-2 text-sm text-primary">← Please verify this information</span>
                    )}
                  </Label>
                  <Input
                    id="bankName"
                    name="bankName"
                    value={payoutFormData.bankName}
                    onChange={handlePayoutFormChange}
                    placeholder="Bank of America"
                    required
                    className={reviewingField === "bankName" ? "border-primary border-2" : ""}
                  />
                </div>
                <div className="grid gap-2">
                  <Label
                    htmlFor="accountNumber"
                    className={reviewingField === "accountNumber" ? "text-primary font-bold animate-pulse" : ""}
                  >
                    Bank Account Number <span className="text-red-500">*</span>
                    {reviewingField === "accountNumber" && (
                      <span className="ml-2 text-sm text-primary">← Please verify this information</span>
                    )}
                  </Label>
                  <Input
                    id="accountNumber"
                    name="accountNumber"
                    value={payoutFormData.accountNumber}
                    onChange={handlePayoutFormChange}
                    placeholder="123456789"
                    required
                    className={reviewingField === "accountNumber" ? "border-primary border-2" : ""}
                  />
                </div>
                <div className="grid gap-2">
                  <Label
                    htmlFor="iban"
                    className={reviewingField === "iban" ? "text-primary font-bold animate-pulse" : ""}
                  >
                    IBAN (if applicable)
                    {reviewingField === "iban" && (
                      <span className="ml-2 text-sm text-primary">← Please verify this information</span>
                    )}
                  </Label>
                  <Input
                    id="iban"
                    name="iban"
                    value={payoutFormData.iban}
                    onChange={handlePayoutFormChange}
                    placeholder="GB29NWBK60161331926819"
                    className={reviewingField === "iban" ? "border-primary border-2" : ""}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="swiftCode">SWIFT/BIC Code (for international transfers)</Label>
                  <Input
                    id="swiftCode"
                    name="swiftCode"
                    value={payoutFormData.swiftCode}
                    onChange={handlePayoutFormChange}
                    placeholder="BOFAUS3N"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="branchAddress">Bank Branch Name & Address</Label>
                  <Textarea
                    id="branchAddress"
                    name="branchAddress"
                    value={payoutFormData.branchAddress}
                    onChange={handlePayoutFormChange}
                    placeholder="123 Main St, New York, NY 10001"
                    rows={2}
                  />
                </div>
              </>
            )}

            {payoutFormData.method === "paypal" && (
              <div className="grid gap-2">
                <Label
                  htmlFor="email"
                  className={reviewingField === "email" ? "text-primary font-bold animate-pulse" : ""}
                >
                  PayPal Email Address <span className="text-red-500">*</span>
                  {reviewingField === "email" && (
                    <span className="ml-2 text-sm text-primary">← Please verify this information</span>
                  )}
                </Label>
                <Input
                  id="email"
                  name="email"
                  value={payoutFormData.email}
                  onChange={handlePayoutFormChange}
                  placeholder="your-email@example.com"
                  type="email"
                  pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
                  required
                  className={reviewingField === "email" ? "border-primary border-2" : ""}
                />
                {payoutFormData.email &&
                  !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(payoutFormData.email) && (
                    <p className="text-sm text-red-500">Please enter a valid email address</p>
                  )}
              </div>
            )}

            {payoutFormData.method === "mobile" && (
              <>
                <div className="grid gap-2">
                  <Label
                    htmlFor="serviceProvider"
                    className={reviewingField === "serviceProvider" ? "text-primary font-bold animate-pulse" : ""}
                  >
                    Service Provider <span className="text-red-500">*</span>
                    {reviewingField === "serviceProvider" && (
                      <span className="ml-2 text-sm text-primary">← Please verify this information</span>
                    )}
                  </Label>
                  <Select
                    name="serviceProvider"
                    value={payoutFormData.serviceProvider}
                    onValueChange={(value) => setPayoutFormData((prev) => ({ ...prev, serviceProvider: value }))}
                  >
                    <SelectTrigger className={reviewingField === "serviceProvider" ? "border-primary border-2" : ""}>
                      <SelectValue placeholder="Select service provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easypaisa">Easypaisa</SelectItem>
                      <SelectItem value="jazzcash">JazzCash</SelectItem>
                      <SelectItem value="nayapay">NayaPay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label
                    htmlFor="mobileNumber"
                    className={reviewingField === "mobileNumber" ? "text-primary font-bold animate-pulse" : ""}
                  >
                    Registered Mobile Number <span className="text-red-500">*</span>
                    {reviewingField === "mobileNumber" && (
                      <span className="ml-2 text-sm text-primary">← Please verify this information</span>
                    )}
                  </Label>
                  <Input
                    id="mobileNumber"
                    name="mobileNumber"
                    value={payoutFormData.mobileNumber}
                    onChange={(e) => {
                      // Only allow numbers
                      const value = e.target.value.replace(/\D/g, "")
                      if (value.length <= 11) {
                        setPayoutFormData((prev) => ({ ...prev, mobileNumber: value }))
                      }
                    }}
                    placeholder="03XXXXXXXXX"
                    required
                    maxLength={11}
                    pattern="[0-9]{11}"
                    className={reviewingField === "mobileNumber" ? "border-primary border-2" : ""}
                  />
                  {payoutFormData.mobileNumber && payoutFormData.mobileNumber.length !== 11 && (
                    <p className="text-sm text-red-500">Mobile number must be exactly 11 digits</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cnic">CNIC (required for transactions over $30)</Label>
                  <Input
                    id="cnic"
                    name="cnic"
                    value={payoutFormData.cnic}
                    onChange={handlePayoutFormChange}
                    placeholder="XXXXX-XXXXXXX-X"
                  />
                </div>
              </>
            )}

            <div className="grid gap-2">
              <Label htmlFor="additionalInfo">Additional Information (Optional)</Label>
              <Textarea
                id="additionalInfo"
                name="additionalInfo"
                value={payoutFormData.additionalInfo}
                onChange={handlePayoutFormChange}
                placeholder="Any additional information we should know"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setPayoutDialogOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={submitPayoutRequest} disabled={payoutSubmitting} className="w-full sm:w-auto">
              {payoutSubmitting ? "Submitting..." : "Request Payout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

