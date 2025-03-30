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
import { BanknoteIcon as Bank, Wallet, Plus, Edit, Trash2 } from "lucide-react"
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
  const fetchPaymentMethods = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/payment-methods")
      if (!response.ok) {
        throw new Error("Failed to fetch payment methods")
      }
      const data = await response.json()
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
      fetchPaymentMethods()
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
      fetchPaymentMethods()
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
      fetchPaymentMethods()
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

  // Filter payment methods by type
  const bankAccounts = paymentMethods.filter((method) => method.type === "bank")
  const mobileWallets = paymentMethods.filter((method) => method.type === "mobile_wallet")

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Payment Methods</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
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
                <div className="flex mt-2 space-x-4">
                  <div
                    className={`flex items-center p-3 rounded-md cursor-pointer border ${
                      methodType === "bank" ? "border-primary bg-primary/10" : "border-gray-200"
                    }`}
                    onClick={() => handleMethodTypeChange("bank")}
                  >
                    <Bank className="mr-2 h-5 w-5" />
                    <span>Bank Account</span>
                  </div>
                  <div
                    className={`flex items-center p-3 rounded-md cursor-pointer border ${
                      methodType === "mobile_wallet" ? "border-primary bg-primary/10" : "border-gray-200"
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
                    <Button type="submit">Save</Button>
                  </DialogFooter>
                </form>
              </Form>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="bank" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="bank">
            <Bank className="mr-2 h-4 w-4" />
            Bank Accounts
          </TabsTrigger>
          <TabsTrigger value="mobile_wallet">
            <Wallet className="mr-2 h-4 w-4" />
            Mobile Wallets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bank" className="mt-6">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : bankAccounts.length === 0 ? (
            <div className="text-center py-10 border rounded-lg">
              <Bank className="mx-auto h-10 w-10 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium">No bank accounts</h3>
              <p className="mt-1 text-sm text-gray-500">Add a bank account to get started.</p>
              <Button
                variant="outline"
                className="mt-4"
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bankAccounts.map((method) => (
                <Card key={method.id} className={method.isActive ? "" : "opacity-60"}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center">
                          <Bank className="mr-2 h-5 w-5" />
                          {method.name}
                        </CardTitle>
                        <CardDescription>{method.bankName}</CardDescription>
                      </div>
                      {!method.isActive && (
                        <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">Inactive</span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Account Title:</span>
                        <p>{method.accountTitle}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Account Number:</span>
                        <p>{method.accountNumber}</p>
                      </div>
                      {method.iban && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">IBAN:</span>
                          <p>{method.iban}</p>
                        </div>
                      )}
                      {method.swiftCode && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Swift Code:</span>
                          <p>{method.swiftCode}</p>
                        </div>
                      )}
                      {method.branchName && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Branch:</span>
                          <p>{method.branchName}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(method)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(method)}>
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : mobileWallets.length === 0 ? (
            <div className="text-center py-10 border rounded-lg">
              <Wallet className="mx-auto h-10 w-10 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium">No mobile wallets</h3>
              <p className="mt-1 text-sm text-gray-500">Add a mobile wallet to get started.</p>
              <Button
                variant="outline"
                className="mt-4"
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mobileWallets.map((method) => (
                <Card key={method.id} className={method.isActive ? "" : "opacity-60"}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center">
                          <Wallet className="mr-2 h-5 w-5" />
                          {method.name}
                        </CardTitle>
                        <CardDescription>
                          {method.providerName
                            ? method.providerName.charAt(0).toUpperCase() + method.providerName.slice(1)
                            : ""}
                        </CardDescription>
                      </div>
                      {!method.isActive && (
                        <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">Inactive</span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Account Title:</span>
                        <p>{method.accountTitle}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Account Number:</span>
                        <p>{method.accountNumber}</p>
                      </div>
                      {method.iban && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">IBAN:</span>
                          <p>{method.iban}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(method)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(method)}>
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
                  <Button type="submit">Update</Button>
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
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

