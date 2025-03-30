"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, AlertCircle, X, Tag, Loader2, Globe, Check, LockIcon, UserIcon } from "lucide-react"
import { useCart } from "@/context/cart-context"
import { useToast } from "@/components/ui/use-toast"
import type { CouponType } from "@/lib/prisma-types"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandGroup, CommandItem } from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getCartTotal, clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [validatingCoupon, setValidatingCoupon] = useState(false)
  const { toast } = useToast()
  const [affiliateCode, setAffiliateCode] = useState<string | null>(null)
  const [couponCode, setCouponCode] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string
    code: string
    description: string
    type: CouponType
    value: number
    discount: number
  } | null>(null)
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false)
  const [isLoadingUserData, setIsLoadingUserData] = useState(true)

  // Currency state
  const [selectedCurrency, setSelectedCurrency] = useState<string>("USD")
  const [conversionRates, setConversionRates] = useState<Record<string, number>>({
    USD: 1,
    PKR: 278.5,
    CAD: 1.35,
    GBP: 0.78,
    EUR: 0.92,
    AED: 3.67,
  })
  const [loadingRates, setLoadingRates] = useState(false)
  const [openCurrencySelector, setOpenCurrencySelector] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    phone: "",
    company: "",
  })

  // Currency data with flags and names
  const currencies = [
    { code: "USD", name: "US Dollar", symbol: "$", flag: "https://flagcdn.com/us.svg" },
    { code: "PKR", name: "Pakistani Rupee", symbol: "₨", flag: "https://flagcdn.com/pk.svg" },
    { code: "CAD", name: "Canadian Dollar", symbol: "C$", flag: "https://flagcdn.com/ca.svg" },
    { code: "GBP", name: "British Pound", symbol: "£", flag: "https://flagcdn.com/gb.svg" },
    { code: "EUR", name: "Euro", symbol: "€", flag: "https://flagcdn.com/eu.svg" },
    { code: "AED", name: "UAE Dirham", symbol: "د.إ", flag: "https://flagcdn.com/ae.svg" },
  ]

  // Get current currency data
  const getCurrentCurrency = () => {
    return currencies.find((c) => c.code === selectedCurrency) || currencies[0]
  }

  // Filter currencies based on search term
  const filteredCurrencies = currencies.filter(
    (currency) =>
      currency.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      currency.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Fetch user data
  const fetchUserData = async () => {
    setIsLoadingUserData(true)
    try {
      // Check if user is logged in by fetching session
      const sessionResponse = await fetch("/api/auth/session")
      if (!sessionResponse.ok) {
        throw new Error("Failed to fetch session")
      }

      const sessionData = await sessionResponse.json()

      // If no session or user, user is not logged in
      if (!sessionData || !sessionData.user) {
        setIsUserLoggedIn(false)
        setIsLoadingUserData(false)
        return
      }

      // User is logged in, fetch profile data
      setIsUserLoggedIn(true)

      const profileResponse = await fetch("/api/user/profile")
      if (!profileResponse.ok) {
        throw new Error("Failed to fetch user profile")
      }

      const profileData = await profileResponse.json()

      // Update form data with user profile information
      setFormData({
        name: profileData.name || sessionData.user.name || "",
        email: profileData.email || sessionData.user.email || "",
        address: profileData.address || "",
        city: profileData.city || "",
        state: profileData.state || "",
        zip: profileData.zip || "",
        country: profileData.country || "",
        phone: profileData.phone || "",
        company: profileData.company || "",
      })
    } catch (error) {
      console.error("Error fetching user data:", error)
      // If there's an error, assume user is not logged in
      setIsUserLoggedIn(false)
    } finally {
      setIsLoadingUserData(false)
    }
  }

  // Fetch exchange rates from API
  const fetchExchangeRates = async () => {
    setLoadingRates(true)
    try {
      // In a real application, you would use an API key and a proper API endpoint
      // This is a placeholder for demonstration purposes
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/USD`)

      if (!response.ok) {
        throw new Error("Failed to fetch exchange rates")
      }

      const data = await response.json()

      if (data && data.rates) {
        // Create a rates object with only our selected currencies
        const newRates: Record<string, number> = { USD: 1 }
        currencies.forEach((currency) => {
          if (currency.code !== "USD" && data.rates[currency.code]) {
            newRates[currency.code] = data.rates[currency.code]
          }
        })

        setConversionRates(newRates)
        toast({
          title: "Exchange rates updated",
          description: "The latest currency exchange rates have been loaded.",
        })
      }
    } catch (error) {
      console.error("Error fetching exchange rates:", error)
      toast({
        title: "Couldn't update exchange rates",
        description: "Using stored rates instead. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setLoadingRates(false)
    }
  }

  useEffect(() => {
    // Redirect if cart is empty
    if (items.length === 0) {
      router.push("/")
    }

    // Fetch user data when component mounts
    fetchUserData()

    // Check for affiliate code in localStorage
    if (typeof window !== "undefined") {
      const storedAffiliateCode = localStorage.getItem("affiliateCode")
      if (storedAffiliateCode) {
        console.log("Found affiliate code in localStorage:", storedAffiliateCode)
        setAffiliateCode(storedAffiliateCode)
      }

      // Check for applied coupon in localStorage
      const storedCoupon = localStorage.getItem("appliedCoupon")
      const storedCouponData = localStorage.getItem("couponData")

      if (storedCoupon && storedCouponData) {
        try {
          const couponData = JSON.parse(storedCouponData)
          validateCoupon(storedCoupon)
        } catch (error) {
          console.error("Error parsing stored coupon data:", error)
        }
      }

      // Check for stored currency preference
      const storedCurrency = localStorage.getItem("preferredCurrency")
      if (storedCurrency && currencies.some((c) => c.code === storedCurrency)) {
        setSelectedCurrency(storedCurrency)
      }
    }

    // Fetch exchange rates when component mounts
    fetchExchangeRates()
  }, [items, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // If user is logged in, don't allow changes
    if (isUserLoggedIn) return

    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const validateCoupon = async (code: string) => {
    if (!code) return

    try {
      setValidatingCoupon(true)

      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          cartTotal: getCartTotal(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Invalid coupon code")
      }

      if (data.valid && data.coupon) {
        setAppliedCoupon({
          ...data.coupon,
          discount: data.coupon.discount || 0,
        })

        toast({
          title: "Coupon applied",
          description: `${data.coupon.code} has been applied to your order.`,
        })

        // Store in localStorage
        localStorage.setItem("appliedCoupon", data.coupon.code)
        localStorage.setItem("couponData", JSON.stringify(data.coupon))
      }
    } catch (error: any) {
      console.error("Error validating coupon:", error)
      toast({
        title: "Invalid coupon",
        description: error.message || "This coupon code is invalid or cannot be applied to your order.",
        variant: "destructive",
      })

      // Clear any previously applied coupon
      setAppliedCoupon(null)
      localStorage.removeItem("appliedCoupon")
      localStorage.removeItem("couponData")
    } finally {
      setValidatingCoupon(false)
    }
  }

  const handleApplyCoupon = () => {
    validateCoupon(couponCode)
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode("")
    localStorage.removeItem("appliedCoupon")
    localStorage.removeItem("couponData")

    toast({
      title: "Coupon removed",
      description: "The coupon has been removed from your order.",
    })
  }

  const convertPrice = (priceInUSD: number): number => {
    return Number.parseFloat((priceInUSD * conversionRates[selectedCurrency]).toFixed(2))
  }

  const getCurrencySymbol = (currency: string): string => {
    const curr = currencies.find((c) => c.code === currency)
    return curr ? curr.symbol : "$"
  }

  const handleCurrencyChange = (currency: string) => {
    setSelectedCurrency(currency)
    localStorage.setItem("preferredCurrency", currency)
    setOpenCurrencySelector(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Validate form
    if (!formData.name || !formData.email) {
      toast({
        title: "Missing information",
        description: "Please provide your name and email address.",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    try {
      // Calculate final total with discount
      const cartTotal = getCartTotal()
      const discount = appliedCoupon ? appliedCoupon.discount : 0
      const finalTotal = Math.max(0, cartTotal - discount)
      const currentCurrency = getCurrentCurrency()

      // Store customer data in session storage for the payment page
      sessionStorage.setItem(
        "checkoutData",
        JSON.stringify({
          customer: formData,
          items: items,
          total: finalTotal,
          originalTotal: cartTotal,
          discount: discount,
          currency: {
            code: selectedCurrency,
            rate: conversionRates[selectedCurrency],
            symbol: currentCurrency.symbol,
            flag: currentCurrency.flag,
            convertedTotal: convertPrice(finalTotal),
          },
          coupon: appliedCoupon
            ? {
                id: appliedCoupon.id,
                code: appliedCoupon.code,
              }
            : null,
          affiliateCode: affiliateCode,
        }),
      )

      // First navigate to the payment page
      router.push("/checkout/payment")

      // Then clear the cart after navigation has started
      setTimeout(() => {
        clearCart()
      }, 500)
    } catch (error: any) {
      console.error("Checkout error:", error)
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p>Loading...</p>
      </div>
    )
  }

  // Calculate totals
  const cartTotal = getCartTotal()
  const discount = appliedCoupon ? appliedCoupon.discount : 0
  const finalTotal = Math.max(0, cartTotal - discount)
  const currentCurrency = getCurrentCurrency()

  return (
    <div className="container mx-auto py-12 px-4 md:px-36 mb-44">
      <Button variant="ghost" className="mb-8" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      {/* Currency indicator at the top of the page */}
      <div className="mb-6">
        <Badge
          variant="outline"
          className="px-3 py-1 text-sm bg-[#21C582] text-white border-0 rounded-[7px] flex items-center gap-2"
        >
          <Image
            src={currentCurrency.flag || "/placeholder.svg"}
            alt={`${currentCurrency.code} flag`}
            width={20}
            height={15}
            className="inline-block"
          />
          <span>Paying in {currentCurrency.code}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs ml-2 hover:bg-[#1eac73] text-white"
            onClick={() => setOpenCurrencySelector(true)}
          >
            Change
          </Button>
        </Badge>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Checkout Form */}
        <div>
          <h1 className="text-3xl font-bold mb-6">Checkout</h1>

          {isUserLoggedIn && (
            <div className="bg-blue-50 p-4 rounded-md flex items-start mb-6">
              <UserIcon className="text-blue-500 mr-2 mt-0.5" size={18} />
              <div>
                <p className="text-blue-800 font-medium">Account Information</p>
                <p className="text-blue-700 text-sm">
                  Your information has been automatically filled from your account. These fields cannot be edited during
                  checkout.
                </p>
              </div>
            </div>
          )}

          {affiliateCode && (
            <div className="bg-green-50 p-4 rounded-md flex items-start mb-6">
              <AlertCircle className="text-green-500 mr-2 mt-0.5" size={18} />
              <div>
                <p className="text-green-800 font-medium">Referral code applied</p>
                <p className="text-green-700 text-sm">You're using a referral code: {affiliateCode}</p>
              </div>
            </div>
          )}

          {isLoadingUserData ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Contact Information</h2>
                  {isUserLoggedIn && (
                    <div className="flex items-center text-sm text-gray-500">
                      <LockIcon className="h-3 w-3 mr-1" />
                      <span>Read-only</span>
                    </div>
                  )}
                </div>

                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      readOnly={isUserLoggedIn}
                      className={isUserLoggedIn ? "bg-gray-50 cursor-not-allowed" : ""}
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      readOnly={isUserLoggedIn}
                      className={isUserLoggedIn ? "bg-gray-50 cursor-not-allowed" : ""}
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      readOnly={isUserLoggedIn}
                      className={isUserLoggedIn ? "bg-gray-50 cursor-not-allowed" : ""}
                    />
                  </div>

                  <div>
                    <Label htmlFor="company">Company Name (Optional)</Label>
                    <Input
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      readOnly={isUserLoggedIn}
                      className={isUserLoggedIn ? "bg-gray-50 cursor-not-allowed" : ""}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Billing Address</h2>
                  {isUserLoggedIn && (
                    <div className="flex items-center text-sm text-gray-500">
                      <LockIcon className="h-3 w-3 mr-1" />
                      <span>Read-only</span>
                    </div>
                  )}
                </div>

                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      readOnly={isUserLoggedIn}
                      className={isUserLoggedIn ? "bg-gray-50 cursor-not-allowed" : ""}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        readOnly={isUserLoggedIn}
                        className={isUserLoggedIn ? "bg-gray-50 cursor-not-allowed" : ""}
                      />
                    </div>

                    <div>
                      <Label htmlFor="state">State/Province</Label>
                      <Input
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        readOnly={isUserLoggedIn}
                        className={isUserLoggedIn ? "bg-gray-50 cursor-not-allowed" : ""}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="zip">ZIP/Postal Code</Label>
                      <Input
                        id="zip"
                        name="zip"
                        value={formData.zip}
                        onChange={handleInputChange}
                        readOnly={isUserLoggedIn}
                        className={isUserLoggedIn ? "bg-gray-50 cursor-not-allowed" : ""}
                      />
                    </div>

                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        readOnly={isUserLoggedIn}
                        className={isUserLoggedIn ? "bg-gray-50 cursor-not-allowed" : ""}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full bg-[#21C582] hover:bg-[#1eac73] text-white" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <>
                    <span className="mr-2">Continue to Payment</span>
                    <Image
                      src={currentCurrency.flag || "/placeholder.svg"}
                      alt={`${currentCurrency.code} flag`}
                      width={20}
                      height={15}
                      className="inline-block"
                    />
                  </>
                )}
              </Button>
            </form>
          )}
        </div>

        {/* Order Summary */}
        <div>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Order Summary</CardTitle>
                <div className="flex items-center bg-blue-50 px-3 py-1 rounded-full">
                  <Image
                    src={currentCurrency.flag || "/placeholder.svg"}
                    alt={`${currentCurrency.code} flag`}
                    width={20}
                    height={15}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-blue-700">{currentCurrency.code}</span>
                </div>
              </div>
              <CardDescription>Review your order details</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Currency Selector */}
              <div className="mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Globe className="h-5 w-5 text-blue-600 mr-2" />
                      <h3 className="font-medium text-blue-800">Select Your Currency</h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={fetchExchangeRates}
                      disabled={loadingRates}
                      className="h-8 text-blue-600"
                    >
                      {loadingRates ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : "Refresh Rates"}
                    </Button>
                  </div>

                  <p className="text-sm text-blue-700 mb-3">
                    Choose the currency you'd like to pay with. Prices will be converted automatically.
                  </p>

                  <Popover open={openCurrencySelector} onOpenChange={setOpenCurrencySelector}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCurrencySelector}
                        className="w-full justify-between bg-white border-blue-200"
                      >
                        <div className="flex items-center">
                          <Image
                            src={currentCurrency.flag || "/placeholder.svg"}
                            alt={`${currentCurrency.code} flag`}
                            width={24}
                            height={18}
                            className="mr-2"
                          />
                          <span>
                            {currentCurrency.code} - {currentCurrency.name}
                          </span>
                        </div>
                        <ArrowLeft className="ml-2 h-4 w-4 shrink-0 opacity-50 rotate-90" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <div className="p-2">
                        <Input
                          placeholder="Search currency..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="mb-2"
                        />
                        <Command className="rounded-lg border shadow-md">
                          <CommandGroup>
                            {filteredCurrencies.length > 0 ? (
                              filteredCurrencies.map((currency) => (
                                <CommandItem
                                  key={currency.code}
                                  onSelect={() => handleCurrencyChange(currency.code)}
                                  className="cursor-pointer flex items-center justify-between"
                                >
                                  <div className="flex items-center">
                                    <Image
                                      src={currency.flag || "/placeholder.svg"}
                                      alt={`${currency.code} flag`}
                                      width={24}
                                      height={18}
                                      className="mr-2"
                                    />
                                    <span>
                                      {currency.code} - {currency.name}
                                    </span>
                                  </div>
                                  {selectedCurrency === currency.code && (
                                    <Check className="ml-auto h-4 w-4 text-green-600" />
                                  )}
                                </CommandItem>
                              ))
                            ) : (
                              <div className="py-6 text-center text-sm text-gray-500">No currency found.</div>
                            )}
                          </CommandGroup>
                        </Command>
                      </div>
                    </PopoverContent>
                  </Popover>

                  {selectedCurrency !== "USD" && (
                    <div className="mt-3 text-sm text-blue-700 bg-blue-100 p-2 rounded flex items-center">
                      <Image
                        src={currentCurrency.flag || "/placeholder.svg"}
                        alt={`${currentCurrency.code} flag`}
                        width={24}
                        height={18}
                        className="mr-2"
                      />
                      <div>
                        <p>
                          Exchange rate: 1 USD = {conversionRates[selectedCurrency]} {selectedCurrency}
                        </p>
                        <p className="text-xs mt-1">Rates updated: {new Date().toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {items
                  .filter((item: any) => item.type !== "currency-info" && !item._hidden)
                  .map((item) => (
                    <div key={item.id} className="border-b pb-4">
                      <div className="flex justify-between">
                        <span className="font-medium">{item.tier} Package</span>
                        <div className="flex items-center">
                          <span>
                            {currentCurrency.symbol}
                            {convertPrice(item.price).toFixed(2)}
                          </span>
                          <Image
                            src={currentCurrency.flag || "/placeholder.svg"}
                            alt={`${currentCurrency.code} flag`}
                            width={16}
                            height={12}
                            className="ml-1"
                          />
                        </div>
                      </div>

                      {item.state && item.stateFee && (
                        <div className="flex justify-between mt-1 text-sm text-gray-600">
                          <span>{item.state} State Filing Fee</span>
                          <span>
                            {currentCurrency.symbol}
                            {convertPrice(item.stateFee).toFixed(2)}
                          </span>
                        </div>
                      )}

                      {item.discount && (
                        <div className="flex justify-between mt-1 text-sm text-[#22c984]">
                          <span>Discounted Price</span>
                          <span>
                            {currentCurrency.symbol}
                            {convertPrice(item.discount).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}

                {/* Coupon Code Input */}
                <div className="pt-4 border-t">
                  <Label htmlFor="couponCode" className="text-sm font-medium mb-2 block">
                    Apply Coupon
                  </Label>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 p-2 rounded-md">
                      <div className="flex items-center">
                        <Tag className="h-4 w-4 mr-2 text-green-600" />
                        <span className="text-green-700 font-medium">{appliedCoupon.code}</span>
                        <span className="text-green-600 text-sm ml-2">
                          (-{currentCurrency.symbol}
                          {convertPrice(appliedCoupon.discount).toFixed(2)})
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={handleRemoveCoupon} className="h-8 w-8 p-0">
                        <X className="h-4 w-4 text-green-700" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        id="couponCode"
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="flex-1"
                      />
                      <Button onClick={handleApplyCoupon} disabled={!couponCode || validatingCoupon} variant="outline">
                        {validatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <div className="flex justify-between font-medium">
                    <span>Subtotal</span>
                    <div className="flex items-center">
                      <span>
                        {currentCurrency.symbol}
                        {convertPrice(cartTotal).toFixed(2)}
                      </span>
                      <Image
                        src={currentCurrency.flag || "/placeholder.svg"}
                        alt={`${currentCurrency.code} flag`}
                        width={16}
                        height={12}
                        className="ml-1"
                      />
                    </div>
                  </div>

                  {appliedCoupon && (
                    <div className="flex justify-between text-green-600 mt-1">
                      <span>Discount</span>
                      <span>
                        -{currentCurrency.symbol}
                        {convertPrice(discount).toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t">
                    <span>Total</span>
                    <div className="flex items-center">
                      <Image
                        src={currentCurrency.flag || "/placeholder.svg"}
                        alt={`${currentCurrency.code} flag`}
                        width={20}
                        height={15}
                        className="mr-1"
                      />
                      <span>
                        {currentCurrency.symbol}
                        {convertPrice(finalTotal).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {selectedCurrency !== "USD" && (
                    <div className="text-sm text-gray-500 mt-2">
                      <p>Original price: ${finalTotal.toFixed(2)} USD</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col">
              {selectedCurrency !== "USD" && (
                <div className="bg-blue-50 p-3 rounded-lg mb-4 flex items-center">
                  <Image
                    src={currentCurrency.flag || "/placeholder.svg"}
                    alt={`${currentCurrency.code} flag`}
                    width={24}
                    height={18}
                    className="mr-2"
                  />
                  <p className="text-sm text-blue-700">
                    You'll be charged in {currentCurrency.code} at the current exchange rate.
                  </p>
                </div>
              )}
              <p className="text-sm text-gray-500 mb-4">
                By completing your purchase, you agree to our Terms of Service and Privacy Policy.
              </p>
              <div className="flex items-center justify-center space-x-4">
                <Image src="/Visa.svg" alt="Visa" className="h-20" width={80} height={80} />
                <Image src="/mastercard.svg" alt="Mastercard" className="h-20" width={80} height={80} />
                <Image src="/amex.svg" alt="Amex" className="h-20" width={80} height={80} />
                <Image src="/stripe.svg" alt="Stripe" className="h-20" width={80} height={80} />
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

