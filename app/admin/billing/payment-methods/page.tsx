"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import type { PaymentMethod } from "@/types/payment-method"
import { BanknoteIcon as Bank, Wallet, Plus, Edit, Trash2, RefreshCw, CheckCircle2, XCircle } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// Form schema for bank accounts
const bankAccountSchema = z.object({
  type: z.literal("bank"),
  name: z.string().min(2, "Name is required"),
  accountTitle: z.string().min(2, "Account title is required"),
  accountNumber: z.string().min(5, "Account number is required"),
  iban: z.string().optional(),
  swiftCode: z.string().optional(),
  branchName: z.string().optional(),
  branchCode: z.string().optional(),
  bankName: z.string().min(2, "Bank name is required"),
  isActive: z.boolean().default(true),
})

// Form schema for mobile wallets
const mobileWalletSchema = z.object({
  type: z.literal("mobile_wallet"),
  name: z.string().min(2, "Name is required"),
  accountTitle: z.string().min(2, "Account title is required"),
  accountNumber: z.string().regex(/^\d{11}$/, "Account number must be 11 digits"),
  iban: z.string().optional(),
  providerName: z.enum(["jazzcash", "easypaisa", "nayapay", "sadapay"], {
    required_error: "Provider is required",
  }),
  isActive: z.boolean().default(true),
})

// Combined schema with discriminated union
const paymentMethodSchema = z.discriminatedUnion("type", [bankAccountSchema, mobileWalletSchema])

// Type for form values
type FormValues = z.infer<typeof paymentMethodSchema>
type BankAccountFormValues = z.infer<typeof bankAccountSchema>
type MobileWalletFormValues = z.infer<typeof mobileWalletSchema>

export default function PaymentMethodsPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [backgroundRefresh, setBackgroundRefresh] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentMethod, setCurrentMethod] = useState<PaymentMethod | null>(null)
  const [methodType, setMethodType] = useState<"bank" | "mobile_wallet">("bank")
  const [activeTab, setActiveTab] = useState("bank")

  // Initialize form with default bank account values
  const form = useForm<FormValues>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      type: "bank",
      name: "",
      accountTitle: "",
      accountNumber: "",
      iban: "",
      swiftCode: "",
      branchName: "",
      branchCode: "",
      bankName: "",
      isActive: true,
    } as BankAccountFormValues,
  })

  // Fetch payment methods
  const fetchPaymentMethods = async (isBackground = false) => {
    try {
      if (!isBackground) {
        setLoading(true)
      }
      const response = await fetch("/api/admin/payment-methods")
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

  // Handle form submission for adding a new payment method
  const onSubmit = async (values: FormValues) => {
    try {
      const response = await fetch("/api/admin/payment-methods", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create payment method")
      }

      toast({
        title: "Success",
        description: "Payment method created successfully",
      })

      setIsAddDialogOpen(false)
      resetForm()
      refreshPaymentMethods()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  // Handle form submission for editing a payment method
  const onEdit = async (values: FormValues) => {
    if (!currentMethod) return

    try {
      const response = await fetch(`/api/admin/payment-methods/${currentMethod.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update payment method")
      }

      toast({
        title: "Success",
        description: "Payment method updated successfully",
      })

      setIsEditDialogOpen(false)
      setCurrentMethod(null)
      refreshPaymentMethods()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  // Handle deleting a payment method
  const handleDelete = async () => {
    if (!currentMethod) return

    try {
      const response = await fetch(`/api/admin/payment-methods/${currentMethod.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete payment method")
      }

      toast({
        title: "Success",
        description: "Payment method deleted successfully",
      })

      setIsDeleteDialogOpen(false)
      setCurrentMethod(null)
      refreshPaymentMethods()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  // Reset form based on method type
  const resetForm = (type: "bank" | "mobile_wallet" = "bank") => {
    if (type === "bank") {
      form.reset({
        type: "bank",
        name: "",
        accountTitle: "",
        accountNumber: "",
        iban: "",
        swiftCode: "",
        branchName: "",
        branchCode: "",
        bankName: "",
        isActive: true,
      } as BankAccountFormValues)
    } else {
      // For mobile wallet, we must provide a valid providerName value
      form.reset({
        type: "mobile_wallet",
        name: "",
        accountTitle: "",
        accountNumber: "",
        iban: "",
        providerName: "jazzcash", // Default to a valid value from the enum
        isActive: true,
      } as MobileWalletFormValues)
    }
  }

  // Open edit dialog and populate form
  const openEditDialog = (method: PaymentMethod) => {
    setCurrentMethod(method)
    setMethodType(method.type)

    // Reset form with current values based on method type
    if (method.type === "bank") {
      form.reset({
        type: "bank",
        name: method.name,
        accountTitle: method.accountTitle,
        accountNumber: method.accountNumber,
        iban: method.iban || undefined,
        swiftCode: method.swiftCode || undefined,
        branchName: method.branchName || undefined,
        branchCode: method.branchCode || undefined,
        bankName: method.bankName || "",
        isActive: method.isActive,
      } as BankAccountFormValues)
    } else {
      form.reset({
        type: "mobile_wallet",
        name: method.name,
        accountTitle: method.accountTitle,
        accountNumber: method.accountNumber,
        iban: method.iban || undefined,
        // Ensure providerName is one of the allowed values
        providerName: method.providerName as "jazzcash" | "easypaisa" | "nayapay" | "sadapay",
        isActive: method.isActive,
      } as MobileWalletFormValues)
    }

    setIsEditDialogOpen(true)
  }

  // Open delete confirmation dialog
  const openDeleteDialog = (method: PaymentMethod) => {
    setCurrentMethod(method)
    setIsDeleteDialogOpen(true)
  }

  // Reset form when dialog is closed
  const handleDialogClose = () => {
    resetForm()
    setIsAddDialogOpen(false)
    setIsEditDialogOpen(false)
    setCurrentMethod(null)
  }

  // Handle method type change
  const handleMethodTypeChange = (type: "bank" | "mobile_wallet") => {
    setMethodType(type)
    resetForm(type)
  }

  // Get provider color
  const getProviderColor = (provider?: string) => {
    if (!provider) return "bg-gray-100"

    switch (provider.toLowerCase()) {
      case "jazzcash":
        return "bg-red-100 text-red-800 border-red-200"
      case "easypaisa":
        return "bg-green-100 text-green-800 border-green-200"
      case "nayapay":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "sadapay":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  // Filter payment methods by type
  const bankAccounts = paymentMethods.filter((method) => method.type === "bank")
  const mobileWallets = paymentMethods.filter((method) => method.type === "mobile_wallet")

  return (
    <div className="px-[3%] py-6 space-y-8 mb-40">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              Payment Methods
            </h1>
            <p className="text-gray-600 mt-1">Manage your organization's payment methods for clients to use</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={refreshPaymentMethods}
              disabled={refreshing}
              className={cn("transition-all duration-300 hover:bg-blue-50", backgroundRefresh && "bg-blue-50")}
            >
              <RefreshCw
                className={cn(
                  "mr-2 h-4 w-4 transition-transform duration-700",
                  (refreshing || backgroundRefresh) && "animate-spin",
                )}
              />
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Payment Method
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Payment Method</DialogTitle>
                  <DialogDescription>Add a new payment method for clients to use.</DialogDescription>
                </DialogHeader>

                <div className="py-4">
                  <div className="mb-4">
                    <Label>Method Type</Label>
                    <div className="flex flex-wrap mt-2 gap-4">
                      <div
                        className={`flex items-center p-3 rounded-md cursor-pointer border transition-all duration-200 ${
                          methodType === "bank"
                            ? "border-blue-500 bg-blue-50 shadow-sm"
                            : "border-gray-200 hover:border-blue-200 hover:bg-blue-50/50"
                        }`}
                        onClick={() => handleMethodTypeChange("bank")}
                      >
                        <Bank className="mr-2 h-5 w-5" />
                        <span>Bank Account</span>
                      </div>
                      <div
                        className={`flex items-center p-3 rounded-md cursor-pointer border transition-all duration-200 ${
                          methodType === "mobile_wallet"
                            ? "border-indigo-500 bg-indigo-50 shadow-sm"
                            : "border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/50"
                        }`}
                        onClick={() => handleMethodTypeChange("mobile_wallet")}
                      >
                        <Wallet className="mr-2 h-5 w-5" />
                        <span>Mobile Wallet</span>
                      </div>
                    </div>
                  </div>

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Company Main Account" {...field} />
                            </FormControl>
                            <FormDescription>A descriptive name for this payment method</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="accountTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Title</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Company Name Ltd." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="accountNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Number</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={methodType === "mobile_wallet" ? "11 digits" : "Account number"}
                                {...field}
                              />
                            </FormControl>
                            {methodType === "mobile_wallet" && (
                              <FormDescription>Must be exactly 11 digits</FormDescription>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {methodType === "bank" ? (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="iban"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>IBAN</FormLabel>
                                  <FormControl>
                                    <Input placeholder="IBAN" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="swiftCode"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Swift Code</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Swift Code" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="bankName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Bank Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Bank Name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="branchName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Branch Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Branch Name" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="branchCode"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Branch Code</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Branch Code" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <FormField
                            control={form.control}
                            name="providerName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Provider</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select provider" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="jazzcash">JazzCash</SelectItem>
                                    <SelectItem value="easypaisa">Easypaisa</SelectItem>
                                    <SelectItem value="nayapay">NayaPay</SelectItem>
                                    <SelectItem value="sadapay">SadaPay</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="iban"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>IBAN (Optional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="IBAN" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
                      )}

                      <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                              <FormLabel>Active</FormLabel>
                              <FormDescription>Make this payment method available to clients</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleDialogClose}>
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        >
                          Save
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <Tabs defaultValue="bank" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2 p-1 bg-blue-50 rounded-lg">
          <TabsTrigger
            value="bank"
            className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm rounded-md transition-all duration-200"
          >
            <Bank className="mr-2 h-4 w-4" />
            Bank Accounts
          </TabsTrigger>
          <TabsTrigger
            value="mobile_wallet"
            className="data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm rounded-md transition-all duration-200"
          >
            <Wallet className="mr-2 h-4 w-4" />
            Mobile Wallets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bank" className="mt-6">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : bankAccounts.length === 0 ? (
            <div className="text-center py-12 border rounded-xl bg-white shadow-sm">
              <div className="bg-blue-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Bank className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-medium text-gray-800">No bank accounts</h3>
              <p className="mt-2 text-gray-500 max-w-md mx-auto">
                Add a bank account to allow your clients to make payments to your organization.
              </p>
              <Button
                className="mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
                onClick={() => {
                  handleMethodTypeChange("bank")
                  setIsAddDialogOpen(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Bank Account
              </Button>
            </div>
          ) : (
            <div
              className={cn(
                "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity duration-300",
                backgroundRefresh && "opacity-60",
              )}
            >
              {bankAccounts.map((method) => (
                <Card
                  key={method.id}
                  className={`overflow-hidden transition-all duration-300 hover:shadow-md ${
                    method.isActive ? "border-blue-100" : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className={`h-2 w-full ${method.isActive ? "bg-blue-500" : "bg-gray-300"}`}></div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center text-gray-800">
                          <Bank className="mr-2 h-5 w-5 text-blue-600" />
                          {method.name}
                        </CardTitle>
                        <CardDescription className="font-medium">{method.bankName}</CardDescription>
                      </div>
                      {method.isActive ? (
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-gray-100 text-gray-700 border-gray-200 flex items-center gap-1"
                        >
                          <XCircle className="h-3 w-3" />
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-3">
                      <div className="bg-gray-50 p-2 rounded-md">
                        <span className="text-xs font-medium text-gray-500 block">Account Title</span>
                        <p className="font-medium text-gray-800">{method.accountTitle}</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded-md">
                        <span className="text-xs font-medium text-gray-500 block">Account Number</span>
                        <p className="font-medium text-gray-800 font-mono">{method.accountNumber}</p>
                      </div>
                      {method.iban && (
                        <div className="bg-gray-50 p-2 rounded-md">
                          <span className="text-xs font-medium text-gray-500 block">IBAN</span>
                          <p className="font-medium text-gray-800 font-mono">{method.iban}</p>
                        </div>
                      )}
                      {method.swiftCode && (
                        <div className="bg-gray-50 p-2 rounded-md">
                          <span className="text-xs font-medium text-gray-500 block">Swift Code</span>
                          <p className="font-medium text-gray-800 font-mono">{method.swiftCode}</p>
                        </div>
                      )}
                      {method.branchName && (
                        <div className="bg-gray-50 p-2 rounded-md">
                          <span className="text-xs font-medium text-gray-500 block">Branch</span>
                          <p className="font-medium text-gray-800">{method.branchName}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2 pt-4 border-t mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(method)}
                      className="hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => openDeleteDialog(method)}
                      className="hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="mobile_wallet" className="mt-6">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            </div>
          ) : mobileWallets.length === 0 ? (
            <div className="text-center py-12 border rounded-xl bg-white shadow-sm">
              <div className="bg-indigo-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Wallet className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-medium text-gray-800">No mobile wallets</h3>
              <p className="mt-2 text-gray-500 max-w-md mx-auto">
                Add a mobile wallet to allow your clients to make payments to your organization using digital payment
                services.
              </p>
              <Button
                className="mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300"
                onClick={() => {
                  handleMethodTypeChange("mobile_wallet")
                  setIsAddDialogOpen(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Mobile Wallet
              </Button>
            </div>
          ) : (
            <div
              className={cn(
                "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity duration-300",
                backgroundRefresh && "opacity-60",
              )}
            >
              {mobileWallets.map((method) => (
                <Card
                  key={method.id}
                  className={`overflow-hidden transition-all duration-300 hover:shadow-md ${
                    method.isActive ? "border-indigo-100" : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className={`h-2 w-full ${method.isActive ? "bg-indigo-500" : "bg-gray-300"}`}></div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center text-gray-800">
                          <Wallet className="mr-2 h-5 w-5 text-indigo-600" />
                          {method.name}
                        </CardTitle>
                        <CardDescription>
                          {method.providerName && (
                            <Badge variant="outline" className={`mt-1 ${getProviderColor(method.providerName)}`}>
                              {method.providerName.charAt(0).toUpperCase() + method.providerName.slice(1)}
                            </Badge>
                          )}
                        </CardDescription>
                      </div>
                      {method.isActive ? (
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-gray-100 text-gray-700 border-gray-200 flex items-center gap-1"
                        >
                          <XCircle className="h-3 w-3" />
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-3">
                      <div className="bg-gray-50 p-2 rounded-md">
                        <span className="text-xs font-medium text-gray-500 block">Account Title</span>
                        <p className="font-medium text-gray-800">{method.accountTitle}</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded-md">
                        <span className="text-xs font-medium text-gray-500 block">Account Number</span>
                        <p className="font-medium text-gray-800 font-mono">{method.accountNumber}</p>
                      </div>
                      {method.iban && (
                        <div className="bg-gray-50 p-2 rounded-md">
                          <span className="text-xs font-medium text-gray-500 block">IBAN</span>
                          <p className="font-medium text-gray-800 font-mono">{method.iban}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2 pt-4 border-t mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(method)}
                      className="hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => openDeleteDialog(method)}
                      className="hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Payment Method</DialogTitle>
            <DialogDescription>Update the payment method details.</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onEdit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Company Main Account" {...field} />
                      </FormControl>
                      <FormDescription>A descriptive name for this payment method</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accountTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Company Name Ltd." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={methodType === "mobile_wallet" ? "11 digits" : "Account number"}
                          {...field}
                        />
                      </FormControl>
                      {methodType === "mobile_wallet" && <FormDescription>Must be exactly 11 digits</FormDescription>}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {methodType === "bank" ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="iban"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>IBAN</FormLabel>
                            <FormControl>
                              <Input placeholder="IBAN" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="swiftCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Swift Code</FormLabel>
                            <FormControl>
                              <Input placeholder="Swift Code" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="bankName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Bank Name" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="branchName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Branch Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Branch Name" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="branchCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Branch Code</FormLabel>
                            <FormControl>
                              <Input placeholder="Branch Code" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <FormField
                      control={form.control}
                      name="providerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Provider</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select provider" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="jazzcash">JazzCash</SelectItem>
                              <SelectItem value="easypaisa">Easypaisa</SelectItem>
                              <SelectItem value="nayapay">NayaPay</SelectItem>
                              <SelectItem value="sadapay">SadaPay</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="iban"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>IBAN (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="IBAN" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>Make this payment method available to clients</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    Update
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the payment method. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

