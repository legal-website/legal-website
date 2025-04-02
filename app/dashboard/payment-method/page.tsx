"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import type { PaymentMethod } from "@/types/payment-method"
import {
  BanknoteIcon as BankIcon,
  SmartphoneIcon,
  Loader2Icon,
  MoreVerticalIcon,
  PencilIcon,
  TrashIcon,
  RefreshCwIcon,
  CopyIcon,
  CheckIcon,
  PlusIcon,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  accountTitle: z.string().min(2, {
    message: "Account title must be at least 2 characters.",
  }),
  accountNumber: z.string().min(5, {
    message: "Account number must be at least 5 characters.",
  }),
  iban: z.string().optional(),
  providerName: z.enum(["jazzcash", "easypaisa", "nayapay", "sadapay"]).optional(),
  isActive: z.boolean().default(true),
})

export default function ClientPaymentMethodsPage() {
  const { toast } = useToast()
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [backgroundRefresh, setBackgroundRefresh] = useState(false)
  const [copiedFields, setCopiedFields] = useState<Record<string, boolean>>({})
  const [activeTab, setActiveTab] = useState("bank_account")

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [addDialogType, setAddDialogType] = useState<"bank_account" | "mobile_wallet">("bank_account")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editDialogType, setEditDialogType] = useState<"bank_account" | "mobile_wallet">("bank_account")
  const [editData, setEditData] = useState<PaymentMethod | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteData, setDeleteData] = useState<PaymentMethod | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      accountTitle: "",
      accountNumber: "",
      iban: "",
      providerName: undefined,
      isActive: true,
    },
  })

  // Fetch payment methods
  const fetchPaymentMethods = async (isBackground = false) => {
    try {
      if (!isBackground) {
        setLoading(true)
      }
      const response = await fetch("/api/payment-methods")
      if (!response.ok) {
        throw new Error("Failed to fetch payment methods")
      }
      const data = await response.json()

      // Add a slight delay for smoother transition when refreshing
      if (isBackground) {
        await new Promise((resolve) => setTimeout(resolve, 300))
      }

      setPaymentMethods(data.paymentMethods)
    } catch (error) {
      console.error("Error fetching payment methods:", error)
      toast({
        title: "Error",
        description: "Failed to load payment methods",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Refresh payment methods with animation
  const refreshPaymentMethods = async () => {
    try {
      setRefreshing(true)
      await fetchPaymentMethods(true)
      toast({
        title: "Refreshed",
        description: "Payment methods refreshed successfully",
      })
    } catch (error) {
      console.error("Error refreshing payment methods:", error)
      toast({
        title: "Error",
        description: "Failed to refresh payment methods",
        variant: "destructive",
      })
    } finally {
      setRefreshing(false)
    }
  }

  // Background refresh every 30 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      setBackgroundRefresh(true)
      fetchPaymentMethods(true).finally(() => {
        setTimeout(() => setBackgroundRefresh(false), 500)
      })
    }, 30000)

    return () => clearInterval(intervalId)
  }, [])

  // Load payment methods on mount
  useEffect(() => {
    fetchPaymentMethods()
  }, [])

  // Handle copying field to clipboard
  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        // Set copied state for this field
        setCopiedFields((prev) => ({ ...prev, [fieldId]: true }))

        // Reset copied state after 2 seconds
        setTimeout(() => {
          setCopiedFields((prev) => ({ ...prev, [fieldId]: false }))
        }, 2000)

        toast({
          title: "Copied!",
          description: "Text copied to clipboard",
          duration: 2000,
        })
      },
      (err) => {
        console.error("Could not copy text: ", err)
        toast({
          title: "Error",
          description: "Failed to copy text",
          variant: "destructive",
        })
      },
    )
  }

  // Filter payment methods by type
  const bankAccounts = paymentMethods.filter((method) => method.type === "bank")
  const mobileWallets = paymentMethods.filter((method) => method.type === "mobile_wallet")

  // Get provider color
  const getProviderColor = (provider?: string | null) => {
    if (!provider) return "bg-gray-100 text-gray-800"

    switch (provider) {
      case "jazzcash":
        return "bg-orange-100 text-orange-800"
      case "easypaisa":
        return "bg-green-100 text-green-800"
      case "nayapay":
        return "bg-purple-100 text-purple-800"
      case "sadapay":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const isLoading = loading

  const openAddDialog = (type: "bank_account" | "mobile_wallet") => {
    setAddDialogType(type)
    setIsAddDialogOpen(true)
    form.reset()
  }

  const openEditDialog = (data: PaymentMethod) => {
    setEditData(data)
    setEditDialogType(data.type === "bank" ? "bank_account" : "mobile_wallet")
    setIsEditDialogOpen(true)
    form.reset({
      name: data.name,
      accountTitle: data.accountTitle,
      accountNumber: data.accountNumber,
      iban: data.iban || "",
      providerName: data.providerName as "jazzcash" | "easypaisa" | "nayapay" | "sadapay" | undefined,
      isActive: data.isActive,
    })
  }

  const openDeleteDialog = (data: PaymentMethod) => {
    setDeleteData(data)
    setIsDeleteDialogOpen(true)
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast({
        title: "Success",
        description: "Payment method saved successfully",
      })
      setIsAddDialogOpen(false)
      setIsEditDialogOpen(false)
      refreshPaymentMethods() // Refresh data
    } catch (error) {
      console.error("Error saving payment method:", error)
      toast({
        title: "Error",
        description: "Failed to save payment method",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast({
        title: "Success",
        description: "Payment method deleted successfully",
      })
      setIsDeleteDialogOpen(false)
      refreshPaymentMethods() // Refresh data
    } catch (error) {
      console.error("Error deleting payment method:", error)
      toast({
        title: "Error",
        description: "Failed to delete payment method",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="px-4 sm:px-6 md:px-[3%] pt-6 sm:pt-9 mb-20 sm:mb-32 md:mb-40 max-w-full overflow-x-hidden">
      <div className="space-y-4 sm:space-y-6">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 sm:p-6 rounded-lg border border-primary/20 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Payment Methods</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
                To ensure a smooth and secure transaction process, please copy the fields below when making payments
                using the company account.
              </p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button
                variant="outline"
                onClick={refreshPaymentMethods}
                disabled={refreshing}
                className={cn(
                  "transition-all duration-300 hover:bg-primary/10 text-sm h-9 px-3 sm:px-4",
                  backgroundRefresh && "bg-primary/5",
                )}
                size="sm"
              >
                <RefreshCwIcon
                  className={cn(
                    "mr-1.5 h-3.5 w-3.5 transition-transform duration-700",
                    (refreshing || backgroundRefresh) && "animate-spin",
                  )}
                />
                {refreshing ? "Refreshing..." : "Refresh"}
              </Button>
              <Button
                variant="default"
                onClick={() => openAddDialog(activeTab as "bank_account" | "mobile_wallet")}
                className="text-sm h-9 px-3 sm:px-4"
                size="sm"
              >
                <PlusIcon className="mr-1.5 h-3.5 w-3.5" />
                Add New
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="bank_account" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6">
            <TabsTrigger value="bank_account" className="text-xs sm:text-sm md:text-base py-2">
              <BankIcon className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Bank Accounts</span>
              <span className="xs:hidden">Banks</span>
            </TabsTrigger>
            <TabsTrigger value="mobile_wallet" className="text-xs sm:text-sm md:text-base py-2">
              <SmartphoneIcon className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Mobile Wallets</span>
              <span className="xs:hidden">Wallets</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bank_account" className="space-y-4 sm:space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg sm:text-xl font-semibold">Your Bank Accounts</h2>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-8 sm:py-12">
                <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : bankAccounts.length === 0 ? (
              <div className="bg-muted/50 rounded-lg p-6 sm:p-8 text-center border border-border">
                <BankIcon className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2">No Bank Accounts</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-4">
                  There are no bank accounts available at the moment.
                </p>
                <Button onClick={() => openAddDialog("bank_account")} size="sm" className="text-sm">
                  <PlusIcon className="mr-1.5 h-3.5 w-3.5" />
                  Add Bank Account
                </Button>
              </div>
            ) : (
              <div
                className={cn(
                  "grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 transition-opacity duration-300",
                  backgroundRefresh && "opacity-60",
                )}
              >
                {bankAccounts.map((account) => (
                  <Card key={account.id} className="overflow-hidden transition-all hover:shadow-md">
                    <CardHeader
                      className={cn(
                        "pb-2 px-4 sm:px-6 pt-4 sm:pt-5",
                        account.isActive ? "border-l-4 border-green-500" : "border-l-4 border-gray-300",
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base sm:text-lg line-clamp-1">{account.name}</CardTitle>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8">
                              <MoreVerticalIcon className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[160px]">
                            <DropdownMenuItem onClick={() => openEditDialog(account)}>
                              <PencilIcon className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openDeleteDialog(account)}>
                              <TrashIcon className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <Badge
                        variant={account.isActive ? "default" : "secondary"}
                        className={cn(
                          "mt-1 text-xs px-2 py-0.5",
                          account.isActive && "bg-green-100 text-green-800 hover:bg-green-100",
                        )}
                      >
                        {account.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </CardHeader>
                    <CardContent className="pt-3 pb-4 px-4 sm:px-6">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between group">
                          <span className="text-xs sm:text-sm text-muted-foreground">Account Title</span>
                          <div className="flex items-center">
                            <span className="text-xs sm:text-sm font-medium truncate max-w-[120px] sm:max-w-[150px]">
                              {account.accountTitle}
                            </span>
                            <button
                              onClick={() => handleCopy(account.accountTitle, `account-title-${account.id}`)}
                              className="ml-1.5 opacity-70 group-hover:opacity-100 transition-opacity"
                              aria-label="Copy account title"
                            >
                              {copiedFields[`account-title-${account.id}`] ? (
                                <CheckIcon className="h-3.5 w-3.5 text-green-500" />
                              ) : (
                                <CopyIcon className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="flex justify-between group">
                          <span className="text-xs sm:text-sm text-muted-foreground">Account Number</span>
                          <div className="flex items-center">
                            <span className="text-xs sm:text-sm font-medium truncate max-w-[120px] sm:max-w-[150px]">
                              {account.accountNumber}
                            </span>
                            <button
                              onClick={() => handleCopy(account.accountNumber, `account-number-${account.id}`)}
                              className="ml-1.5 opacity-70 group-hover:opacity-100 transition-opacity"
                              aria-label="Copy account number"
                            >
                              {copiedFields[`account-number-${account.id}`] ? (
                                <CheckIcon className="h-3.5 w-3.5 text-green-500" />
                              ) : (
                                <CopyIcon className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="flex justify-between group">
                          <span className="text-xs sm:text-sm text-muted-foreground">IBAN</span>
                          <div className="flex items-center">
                            <span className="text-xs sm:text-sm font-medium truncate max-w-[120px] sm:max-w-[150px]">
                              {account.iban || "N/A"}
                            </span>
                            {account.iban && (
                              <button
                                onClick={() => handleCopy(account.iban || "", `iban-${account.id}`)}
                                className="ml-1.5 opacity-70 group-hover:opacity-100 transition-opacity"
                                aria-label="Copy IBAN"
                              >
                                {copiedFields[`iban-${account.id}`] ? (
                                  <CheckIcon className="h-3.5 w-3.5 text-green-500" />
                                ) : (
                                  <CopyIcon className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-between group">
                          <span className="text-xs sm:text-sm text-muted-foreground">Swift Code</span>
                          <div className="flex items-center">
                            <span className="text-xs sm:text-sm font-medium truncate max-w-[120px] sm:max-w-[150px]">
                              {account.swiftCode || "N/A"}
                            </span>
                            {account.swiftCode && (
                              <button
                                onClick={() => handleCopy(account.swiftCode || "", `swift-${account.id}`)}
                                className="ml-1.5 opacity-70 group-hover:opacity-100 transition-opacity"
                                aria-label="Copy Swift code"
                              >
                                {copiedFields[`swift-${account.id}`] ? (
                                  <CheckIcon className="h-3.5 w-3.5 text-green-500" />
                                ) : (
                                  <CopyIcon className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-between group">
                          <span className="text-xs sm:text-sm text-muted-foreground">Branch Name</span>
                          <div className="flex items-center">
                            <span className="text-xs sm:text-sm font-medium truncate max-w-[120px] sm:max-w-[150px]">
                              {account.branchName || "N/A"}
                            </span>
                            {account.branchName && (
                              <button
                                onClick={() => handleCopy(account.branchName || "", `branch-${account.id}`)}
                                className="ml-1.5 opacity-70 group-hover:opacity-100 transition-opacity"
                                aria-label="Copy branch name"
                              >
                                {copiedFields[`branch-${account.id}`] ? (
                                  <CheckIcon className="h-3.5 w-3.5 text-green-500" />
                                ) : (
                                  <CopyIcon className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-between group">
                          <span className="text-xs sm:text-sm text-muted-foreground">Bank Name</span>
                          <div className="flex items-center">
                            <span className="text-xs sm:text-sm font-medium truncate max-w-[120px] sm:max-w-[150px]">
                              {account.bankName || "N/A"}
                            </span>
                            {account.bankName && (
                              <button
                                onClick={() => handleCopy(account.bankName || "", `bank-${account.id}`)}
                                className="ml-1.5 opacity-70 group-hover:opacity-100 transition-opacity"
                                aria-label="Copy bank name"
                              >
                                {copiedFields[`bank-${account.id}`] ? (
                                  <CheckIcon className="h-3.5 w-3.5 text-green-500" />
                                ) : (
                                  <CopyIcon className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="mobile_wallet" className="space-y-4 sm:space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg sm:text-xl font-semibold">Your Mobile Wallets</h2>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-8 sm:py-12">
                <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : mobileWallets.length === 0 ? (
              <div className="bg-muted/50 rounded-lg p-6 sm:p-8 text-center border border-border">
                <SmartphoneIcon className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2">No Mobile Wallets</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-4">
                  There are no mobile wallets available at the moment.
                </p>
                <Button onClick={() => openAddDialog("mobile_wallet")} size="sm" className="text-sm">
                  <PlusIcon className="mr-1.5 h-3.5 w-3.5" />
                  Add Mobile Wallet
                </Button>
              </div>
            ) : (
              <div
                className={cn(
                  "grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 transition-opacity duration-300",
                  backgroundRefresh && "opacity-60",
                )}
              >
                {mobileWallets.map((wallet) => (
                  <Card key={wallet.id} className="overflow-hidden transition-all hover:shadow-md">
                    <CardHeader
                      className={cn(
                        "pb-2 px-4 sm:px-6 pt-4 sm:pt-5",
                        wallet.isActive ? "border-l-4 border-green-500" : "border-l-4 border-gray-300",
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base sm:text-lg line-clamp-1">{wallet.name}</CardTitle>
                          <Badge className="mt-1 text-xs px-2 py-0.5" variant="outline">
                            {wallet.providerName
                              ? wallet.providerName.charAt(0).toUpperCase() + wallet.providerName.slice(1)
                              : "Unknown"}
                          </Badge>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8">
                              <MoreVerticalIcon className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[160px]">
                            <DropdownMenuItem onClick={() => openEditDialog(wallet)}>
                              <PencilIcon className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openDeleteDialog(wallet)}>
                              <TrashIcon className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <Badge
                        variant={wallet.isActive ? "default" : "secondary"}
                        className={cn(
                          "mt-1 text-xs px-2 py-0.5",
                          wallet.isActive && "bg-green-100 text-green-800 hover:bg-green-100",
                        )}
                      >
                        {wallet.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </CardHeader>
                    <CardContent className="pt-3 pb-4 px-4 sm:px-6">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between group">
                          <span className="text-xs sm:text-sm text-muted-foreground">Account Title</span>
                          <div className="flex items-center">
                            <span className="text-xs sm:text-sm font-medium truncate max-w-[120px] sm:max-w-[150px]">
                              {wallet.accountTitle}
                            </span>
                            <button
                              onClick={() => handleCopy(wallet.accountTitle, `wallet-title-${wallet.id}`)}
                              className="ml-1.5 opacity-70 group-hover:opacity-100 transition-opacity"
                              aria-label="Copy account title"
                            >
                              {copiedFields[`wallet-title-${wallet.id}`] ? (
                                <CheckIcon className="h-3.5 w-3.5 text-green-500" />
                              ) : (
                                <CopyIcon className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="flex justify-between group">
                          <span className="text-xs sm:text-sm text-muted-foreground">Account Number</span>
                          <div className="flex items-center">
                            <span className="text-xs sm:text-sm font-medium truncate max-w-[120px] sm:max-w-[150px]">
                              {wallet.accountNumber}
                            </span>
                            <button
                              onClick={() => handleCopy(wallet.accountNumber, `wallet-number-${wallet.id}`)}
                              className="ml-1.5 opacity-70 group-hover:opacity-100 transition-opacity"
                              aria-label="Copy account number"
                            >
                              {copiedFields[`wallet-number-${wallet.id}`] ? (
                                <CheckIcon className="h-3.5 w-3.5 text-green-500" />
                              ) : (
                                <CopyIcon className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px] p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-1 sm:space-y-2">
            <DialogTitle>Add {addDialogType === "bank_account" ? "Bank Account" : "Mobile Wallet"}</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Fill in the details to add a new {addDialogType === "bank_account" ? "bank account" : "mobile wallet"}.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Personal Account" {...field} className="text-sm" />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accountTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Account Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. John Doe" {...field} className="text-sm" />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Account Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 1234567890" {...field} className="text-sm" />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              {addDialogType === "bank_account" && (
                <FormField
                  control={form.control}
                  name="iban"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">IBAN</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. PK36SCBL0000001123456702" {...field} className="text-sm" />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              )}
              {addDialogType === "mobile_wallet" && (
                <FormField
                  control={form.control}
                  name="providerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Provider</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder="Select a provider" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="jazzcash" className="text-sm">
                            JazzCash
                          </SelectItem>
                          <SelectItem value="easypaisa" className="text-sm">
                            EasyPaisa
                          </SelectItem>
                          <SelectItem value="nayapay" className="text-sm">
                            NayaPay
                          </SelectItem>
                          <SelectItem value="sadapay" className="text-sm">
                            SadaPay
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 sm:p-4">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-0.5 leading-none">
                      <FormLabel className="text-xs sm:text-sm">Active</FormLabel>
                      <FormDescription className="text-xs">
                        This payment method will be available for receiving payments.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-2 sm:pt-3">
                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto text-sm" size="sm">
                  {isSubmitting ? (
                    <>
                      <Loader2Icon className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-1 sm:space-y-2">
            <DialogTitle>Edit {editDialogType === "bank_account" ? "Bank Account" : "Mobile Wallet"}</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Update the details of your {editDialogType === "bank_account" ? "bank account" : "mobile wallet"}.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Personal Account" {...field} className="text-sm" />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accountTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Account Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. John Doe" {...field} className="text-sm" />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Account Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 1234567890" {...field} className="text-sm" />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              {editDialogType === "bank_account" && (
                <FormField
                  control={form.control}
                  name="iban"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">IBAN</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. PK36SCBL0000001123456702" {...field} className="text-sm" />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              )}
              {editDialogType === "mobile_wallet" && (
                <FormField
                  control={form.control}
                  name="providerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Provider</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder="Select a provider" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="jazzcash" className="text-sm">
                            JazzCash
                          </SelectItem>
                          <SelectItem value="easypaisa" className="text-sm">
                            EasyPaisa
                          </SelectItem>
                          <SelectItem value="nayapay" className="text-sm">
                            NayaPay
                          </SelectItem>
                          <SelectItem value="sadapay" className="text-sm">
                            SadaPay
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 sm:p-4">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-0.5 leading-none">
                      <FormLabel className="text-xs sm:text-sm">Active</FormLabel>
                      <FormDescription className="text-xs">
                        This payment method will be available for receiving payments.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-2 sm:pt-3">
                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto text-sm" size="sm">
                  {isSubmitting ? (
                    <>
                      <Loader2Icon className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-[400px] p-5 sm:p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              This action cannot be undone. This will permanently delete your payment method.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="text-sm mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-sm"
            >
              {isDeleting ? (
                <>
                  <Loader2Icon className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

