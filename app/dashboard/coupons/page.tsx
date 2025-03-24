"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Search, Tag, Copy, CheckCircle2, XCircle, RefreshCw, AlertCircle, SortAsc } from "lucide-react"
import { formatCouponValue } from "@/lib/coupon"
import type { CouponType } from "@/lib/prisma-types"
import { format } from "date-fns"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationEllipsis,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface Coupon {
  id: string
  code: string
  description: string
  type: CouponType
  value: number
  expiresAt: string
  minimumAmount: number | null
}

type SortOption = "newest" | "expiringSoon" | "highestValue" | "lowestValue"

export default function DashboardCouponsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("available")
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>("expiringSoon")
  const [currentPage, setCurrentPage] = useState(1)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const ITEMS_PER_PAGE = 12

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/dashboard/coupons")
    } else if (status === "authenticated") {
      fetchCoupons()

      // Check if there's a coupon in localStorage
      const storedCoupon = localStorage.getItem("appliedCoupon")
      if (storedCoupon) {
        setAppliedCoupon(storedCoupon)
      }
    }
  }, [status, router])

  const fetchCoupons = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/coupons/user")

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to fetch coupons")
      }

      const data = await response.json()
      setCoupons(data.coupons || [])
    } catch (error) {
      console.error("Error fetching coupons:", error)
      setError(error instanceof Error ? error.message : "Failed to load coupons")
      toast({
        title: "Error",
        description: "Failed to load available coupons. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchCoupons()
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)

    toast({
      title: "Coupon code copied",
      description: `${code} has been copied to your clipboard.`,
    })

    setTimeout(() => {
      setCopiedCode(null)
    }, 2000)
  }

  const handleApplyCoupon = (coupon: Coupon) => {
    // Store the coupon in localStorage
    localStorage.setItem("appliedCoupon", coupon.code)
    localStorage.setItem("couponData", JSON.stringify(coupon))
    setAppliedCoupon(coupon.code)

    toast({
      title: "Coupon applied",
      description: `${coupon.code} will be applied to your next purchase.`,
    })

    // Redirect to checkout if desired
    // router.push("/checkout")
  }

  const handleRemoveCoupon = () => {
    localStorage.removeItem("appliedCoupon")
    localStorage.removeItem("couponData")
    setAppliedCoupon(null)

    toast({
      title: "Coupon removed",
      description: "The coupon has been removed from your cart.",
    })
  }

  const sortCoupons = (coupons: Coupon[]) => {
    switch (sortBy) {
      case "newest":
        return [...coupons].sort((a, b) => new Date(b.expiresAt).getTime() - new Date(a.expiresAt).getTime())
      case "expiringSoon":
        return [...coupons].sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime())
      case "highestValue":
        return [...coupons].sort((a, b) => b.value - a.value)
      case "lowestValue":
        return [...coupons].sort((a, b) => a.value - b.value)
      default:
        return coupons
    }
  }

  const filteredCoupons = coupons.filter((coupon) => {
    return (
      coupon.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coupon.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  const sortedCoupons = sortCoupons(filteredCoupons)

  // Pagination
  const totalPages = Math.ceil(sortedCoupons.length / ITEMS_PER_PAGE)
  const paginatedCoupons = sortedCoupons.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, sortBy, activeTab])

  if (status === "loading") {
    return <CouponPageLoader />
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-2">My Coupons</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        View and apply available discount coupons to your purchases
      </p>

      {appliedCoupon && (
        <Alert className="mb-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle className="text-green-800 dark:text-green-400">Coupon Applied</AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-500">
            Coupon code <span className="font-semibold">{appliedCoupon}</span> is currently applied to your cart.
            <Button
              variant="link"
              className="text-green-700 dark:text-green-500 p-0 h-auto ml-2"
              onClick={handleRemoveCoupon}
            >
              Remove
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="mb-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertTitle className="text-red-800 dark:text-red-400">Error</AlertTitle>
          <AlertDescription className="text-red-700 dark:text-red-500">
            {error}
            <Button variant="link" className="text-red-700 dark:text-red-500 p-0 h-auto ml-2" onClick={fetchCoupons}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Top Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search coupons..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <div className="w-48">
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger>
                <SortAsc className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expiringSoon">Expiring Soon</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="highestValue">Highest Value</SelectItem>
                <SelectItem value="lowestValue">Lowest Value</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing} className="h-10 w-10">
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="available" className="flex-1 sm:flex-initial">
            Available
          </TabsTrigger>
          <TabsTrigger value="used" className="flex-1 sm:flex-initial">
            Used
          </TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="mt-4">
          {loading ? (
            <CouponPageLoader />
          ) : paginatedCoupons.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <Tag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No coupons available</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-md mx-auto">
                {searchQuery
                  ? `No coupons match your search for "${searchQuery}"`
                  : "You don't have any available coupons at the moment. Check back later for special offers."}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedCoupons.map((coupon) => (
                  <CouponCard
                    key={coupon.id}
                    coupon={coupon}
                    onCopy={() => handleCopyCode(coupon.code)}
                    onApply={() => handleApplyCoupon(coupon)}
                    isCopied={copiedCode === coupon.code}
                    isApplied={appliedCoupon === coupon.code}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8">
                  <CustomPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="used" className="mt-4">
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <XCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No used coupons</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-md mx-auto">
              You haven't used any coupons yet. When you use a coupon, it will appear here.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function CouponCard({
  coupon,
  onCopy,
  onApply,
  isCopied,
  isApplied,
}: {
  coupon: Coupon
  onCopy: () => void
  onApply: () => void
  isCopied: boolean
  isApplied: boolean
}) {
  const daysUntilExpiry = Math.ceil(
    (new Date(coupon.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
  )

  const isExpiringSoon = daysUntilExpiry <= 7

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow duration-300">
      <CardHeader className="bg-green-50 dark:bg-green-900/20 pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{coupon.code}</CardTitle>
            <CardDescription>{coupon.description}</CardDescription>
          </div>
          <div className="bg-white dark:bg-gray-800 p-2 rounded-md">
            <Tag className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Discount</p>
            <p className="text-xl font-bold">{formatCouponValue(coupon.type, coupon.value)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Expires</p>
            <p className={`text-sm font-medium ${isExpiringSoon ? "text-red-600 dark:text-red-400" : ""}`}>
              {format(new Date(coupon.expiresAt), "MMM d, yyyy")}
              {isExpiringSoon && ` (${daysUntilExpiry} days left)`}
            </p>
          </div>
        </div>

        {coupon.minimumAmount && (
          <div className="mb-4 p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
            <AlertCircle className="h-4 w-4 inline-block mr-1 text-amber-500" />
            <span>Minimum purchase: ${coupon.minimumAmount}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-2 pt-0">
        <Button variant="outline" className="flex-1" onClick={onCopy}>
          {isCopied ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Copied
            </>
          ) : (
            <>
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </>
          )}
        </Button>
        <Button
          className="flex-1 bg-green-600 hover:bg-green-700"
          style={{ backgroundColor: "#22C984", borderColor: "#22C984" }}
          onClick={onApply}
          disabled={isApplied}
        >
          {isApplied ? "Applied" : "Apply"}
        </Button>
      </CardFooter>
    </Card>
  )
}

function CustomPagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = []

    // Always show first page
    pages.push(1)

    // Current page and surrounding pages
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (pages[pages.length - 1] !== i - 1) {
        // Add ellipsis if there's a gap
        pages.push(-1)
      }
      pages.push(i)
    }

    // Add last page if not already included
    if (totalPages > 1) {
      if (pages[pages.length - 1] !== totalPages - 1) {
        // Add ellipsis if there's a gap
        pages.push(-1)
      }
      pages.push(totalPages)
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <Pagination>
      <PaginationContent>
        {currentPage > 1 && (
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => {
                e.preventDefault()
                onPageChange(currentPage - 1)
              }}
            />
          </PaginationItem>
        )}

        {pageNumbers.map((page, i) =>
          page === -1 ? (
            <PaginationItem key={`ellipsis-${i}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={page}>
              <PaginationLink
                href="#"
                isActive={page === currentPage}
                onClick={(e) => {
                  e.preventDefault()
                  onPageChange(page)
                }}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ),
        )}

        {currentPage < totalPages && (
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => {
                e.preventDefault()
                onPageChange(currentPage + 1)
              }}
            />
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  )
}

function CouponPageLoader() {
  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl">
      <div className="flex flex-col items-center justify-center py-12">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-gray-200 rounded-full"></div>
          <div className="w-20 h-20 border-4 border-t-green-500 animate-spin rounded-full absolute top-0 left-0"></div>
        </div>
        <div className="mt-4 flex flex-col items-center">
          <div className="h-2 w-24 bg-gray-200 rounded animate-pulse mb-2.5"></div>
          <div className="h-2 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-6"></div>
              <div className="flex justify-between mb-4">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              </div>
              <div className="flex gap-2 mt-4">
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

