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
  PlusIcon,
  Loader2Icon,
  MoreVerticalIcon,
  PencilIcon,
  TrashIcon,
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
  const [copiedFields, setCopiedFields] = useState<Record<string, boolean>>({})
  const [activeTab, setActiveTab] = useState("bank")

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
  const fetchPaymentMethods = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/payment-methods")
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
      fetchPaymentMethods() // Refresh data
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
      fetchPaymentMethods() // Refresh data
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
    <div className="px-[3%] mb-40">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-lg border border-primary/20 shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight">Payment Methods</h1>
          <p className="text-muted-foreground mt-2">
            Manage your payment methods for receiving payments from the platform.
          </p>
        </div>

        <Tabs defaultValue="bank_account" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="bank_account" className="text-sm md:text-base">
              <BankIcon className="mr-2 h-4 w-4" />
              Bank Accounts
            </TabsTrigger>
            <TabsTrigger value="mobile_wallet" className="text-sm md:text-base">
              <SmartphoneIcon className="mr-2 h-4 w-4" />
              Mobile Wallets
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bank_account" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Your Bank Accounts</h2>
              <Button onClick={() => openAddDialog("bank_account")} className="transition-all hover:scale-105">
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Bank Account
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : bankAccounts.length === 0 ? (
              <div className="bg-muted/50 rounded-lg p-8 text-center border border-border">
                <BankIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Bank Accounts</h3>
                <p className="text-muted-foreground mb-4">You haven't added any bank accounts yet.</p>
                <Button
                  onClick={() => openAddDialog("bank_account")}
                  variant="outline"
                  className="transition-all hover:bg-primary hover:text-primary-foreground"
                >
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add Bank Account
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {bankAccounts.map((account) => (
                  <Card key={account.id} className="overflow-hidden transition-all hover:shadow-md">
                    <CardHeader
                      className={cn(
                        "pb-2",
                        account.isActive ? "border-l-4 border-green-500" : "border-l-4 border-gray-300",
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{account.name}</CardTitle>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVerticalIcon className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
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
                        className={cn("mt-1", account.isActive && "bg-green-100 text-green-800 hover:bg-green-100")}
                      >
                        {account.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Account Title</span>
                          <span className="text-sm font-medium">{account.accountTitle}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Account Number</span>
                          <span className="text-sm font-medium">{account.accountNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">IBAN</span>
                          <span className="text-sm font-medium">{account.iban}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="mobile_wallet" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Your Mobile Wallets</h2>
              <Button onClick={() => openAddDialog("mobile_wallet")} className="transition-all hover:scale-105">
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Mobile Wallet
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : mobileWallets.length === 0 ? (
              <div className="bg-muted/50 rounded-lg p-8 text-center border border-border">
                <SmartphoneIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Mobile Wallets</h3>
                <p className="text-muted-foreground mb-4">You haven't added any mobile wallets yet.</p>
                <Button
                  onClick={() => openAddDialog("mobile_wallet")}
                  variant="outline"
                  className="transition-all hover:bg-primary hover:text-primary-foreground"
                >
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add Mobile Wallet
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {mobileWallets.map((wallet) => (
                  <Card key={wallet.id} className="overflow-hidden transition-all hover:shadow-md">
                    <CardHeader
                      className={cn(
                        "pb-2",
                        wallet.isActive ? "border-l-4 border-green-500" : "border-l-4 border-gray-300",
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{wallet.name}</CardTitle>
                          <Badge className="mt-1" variant="outline">
                            {wallet.providerName
                              ? wallet.providerName.charAt(0).toUpperCase() + wallet.providerName.slice(1)
                              : "Unknown"}
                          </Badge>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVerticalIcon className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
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
                        className={cn("mt-1", wallet.isActive && "bg-green-100 text-green-800 hover:bg-green-100")}
                      >
                        {wallet.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Account Title</span>
                          <span className="text-sm font-medium">{wallet.accountTitle}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Account Number</span>
                          <span className="text-sm font-medium">{wallet.accountNumber}</span>
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add {addDialogType === "bank_account" ? "Bank Account" : "Mobile Wallet"}</DialogTitle>
            <DialogDescription>
              Fill in the details to add a new {addDialogType === "bank_account" ? "bank account" : "mobile wallet"}.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Personal Account" {...field} />
                    </FormControl>
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
                      <Input placeholder="e.g. John Doe" {...field} />
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
                      <Input placeholder="e.g. 1234567890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {addDialogType === "bank_account" && (
                <FormField
                  control={form.control}
                  name="iban"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IBAN</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. PK36SCBL0000001123456702" {...field} />
                      </FormControl>
                      <FormMessage />
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
                      <FormLabel>Provider</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a provider" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="jazzcash">JazzCash</SelectItem>
                          <SelectItem value="easypaisa">EasyPaisa</SelectItem>
                          <SelectItem value="nayapay">NayaPay</SelectItem>
                          <SelectItem value="sadapay">SadaPay</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Active</FormLabel>
                      <FormDescription>This payment method will be available for receiving payments.</FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                  {isSubmitting ? (
                    <>
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit {editDialogType === "bank_account" ? "Bank Account" : "Mobile Wallet"}</DialogTitle>
            <DialogDescription>
              Update the details of your {editDialogType === "bank_account" ? "bank account" : "mobile wallet"}.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Personal Account" {...field} />
                    </FormControl>
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
                      <Input placeholder="e.g. John Doe" {...field} />
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
                      <Input placeholder="e.g. 1234567890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {editDialogType === "bank_account" && (
                <FormField
                  control={form.control}
                  name="iban"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IBAN</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. PK36SCBL0000001123456702" {...field} />
                      </FormControl>
                      <FormMessage />
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
                      <FormLabel>Provider</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a provider" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="jazzcash">JazzCash</SelectItem>
                          <SelectItem value="easypaisa">EasyPaisa</SelectItem>
                          <SelectItem value="nayapay">NayaPay</SelectItem>
                          <SelectItem value="sadapay">SadaPay</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Active</FormLabel>
                      <FormDescription>This payment method will be available for receiving payments.</FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                  {isSubmitting ? (
                    <>
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your payment method.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
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

