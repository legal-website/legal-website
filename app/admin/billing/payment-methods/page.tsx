"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Building, CreditCard, Plus, Pencil, Trash2, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

// Define the schema for validation
const bankDetailsSchema = z.object({
  accountName: z.string().min(2, { message: "Account name is required" }),
  accountNumber: z.string().min(1, { message: "Account number is required" }),
  routingNumber: z.string().min(1, { message: "Routing number is required" }),
  bankName: z.string().min(2, { message: "Bank name is required" }),
  accountType: z.enum(["checking", "savings"], {
    required_error: "Please select an account type",
  }),
  swiftCode: z.string().optional(),
  branchName: z.string().optional(),
  branchCode: z.string().optional(),
  isDefault: z.boolean().default(false),
})

type BankDetailsFormValues = z.infer<typeof bankDetailsSchema>

type BankAccount = {
  id: string
  accountName: string
  accountNumber: string
  routingNumber: string
  bankName: string
  accountType: string
  swiftCode?: string
  branchName?: string
  branchCode?: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export default function PaymentMethodsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<BankDetailsFormValues>({
    resolver: zodResolver(bankDetailsSchema),
    defaultValues: {
      accountName: "",
      accountNumber: "",
      routingNumber: "",
      bankName: "",
      accountType: "checking",
      swiftCode: "",
      branchName: "",
      branchCode: "",
      isDefault: false,
    },
  })

  // Fetch bank accounts
  const fetchBankAccounts = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/admin/bank-accounts")

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error response:", errorData)
        throw new Error(errorData.message || "Failed to fetch bank accounts")
      }

      const data = await response.json()
      setBankAccounts(data.bankAccounts || [])
    } catch (error) {
      console.error("Error fetching bank accounts:", error)
      setError(String(error))
      toast.error("Failed to fetch bank accounts")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBankAccounts()
  }, [])

  // Handle form submission
  const onSubmit = async (values: BankDetailsFormValues) => {
    setIsSubmitting(true)
    setError(null)
    try {
      const url = "/api/user/bank-details"
      const method = editingAccount ? "PUT" : "POST"

      const payload = editingAccount ? { ...values, id: editingAccount.id } : values

      console.log("Submitting payload:", payload)

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error response:", errorData)
        throw new Error(errorData.message || `Failed to ${editingAccount ? "update" : "create"} bank account`)
      }

      const data = await response.json()

      toast.success(editingAccount ? "Bank account updated successfully" : "Bank account added successfully")
      setIsDialogOpen(false)
      form.reset()
      setEditingAccount(null)
      fetchBankAccounts()
    } catch (error) {
      console.error("Error saving bank account:", error)
      setError(String(error))
      toast.error(String(error) || "An error occurred while saving bank account")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle account deletion
  const handleDeleteAccount = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bank account?")) {
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/user/bank-details?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error response:", errorData)
        throw new Error(errorData.message || "Failed to delete bank account")
      }

      toast.success("Bank account deleted successfully")
      fetchBankAccounts()
    } catch (error) {
      console.error("Error deleting bank account:", error)
      setError(String(error))
      toast.error(String(error) || "An error occurred while deleting bank account")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle edit button click
  const handleEditAccount = (account: BankAccount) => {
    setEditingAccount(account)
    form.reset({
      accountName: account.accountName,
      accountNumber: account.accountNumber,
      routingNumber: account.routingNumber,
      bankName: account.bankName,
      accountType: account.accountType as "checking" | "savings",
      swiftCode: account.swiftCode || "",
      branchName: account.branchName || "",
      branchCode: account.branchCode || "",
      isDefault: account.isDefault,
    })
    setIsDialogOpen(true)
  }

  // Handle add button click
  const handleAddAccount = () => {
    setEditingAccount(null)
    form.reset({
      accountName: "",
      accountNumber: "",
      routingNumber: "",
      bankName: "",
      accountType: "checking",
      swiftCode: "",
      branchName: "",
      branchCode: "",
      isDefault: false,
    })
    setIsDialogOpen(true)
  }

  // Handle add default ORIZEN INC account
  const handleAddDefaultAccount = () => {
    setEditingAccount(null)
    form.reset({
      accountName: "ORIZEN INC",
      accountNumber: "08751010024993",
      routingNumber: "PK51ALFH0875001010024993",
      bankName: "Bank Alfalah",
      accountType: "checking",
      swiftCode: "ALFHPKKAXXX",
      branchName: "EME DHA Br.LHR",
      branchCode: "0875",
      isDefault: true,
    })
    setIsDialogOpen(true)
  }

  // Close dialog and reset form
  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingAccount(null)
    form.reset()
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Payment Methods</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleAddDefaultAccount}>
            Add ORIZEN Default
          </Button>
          <Button onClick={handleAddAccount}>
            <Plus className="mr-2 h-4 w-4" /> Add Bank Account
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Bank Accounts
          </CardTitle>
          <CardDescription>Manage bank accounts for receiving payments</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : bankAccounts.length > 0 ? (
            <div className="space-y-4">
              {bankAccounts.map((account) => (
                <div key={account.id} className={`border rounded-lg p-4 ${account.isDefault ? "border-primary" : ""}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{account.accountName}</h3>
                        {account.isDefault && (
                          <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">Default</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {account.bankName} • {account.accountNumber}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 mt-2">
                        <p className="text-sm">
                          <span className="text-muted-foreground">Account Type:</span>{" "}
                          <span className="capitalize">{account.accountType}</span>
                        </p>
                        <p className="text-sm">
                          <span className="text-muted-foreground">Routing Number:</span> {account.routingNumber}
                        </p>
                        {account.swiftCode && (
                          <p className="text-sm">
                            <span className="text-muted-foreground">Swift Code:</span> {account.swiftCode}
                          </p>
                        )}
                        {account.branchName && (
                          <p className="text-sm">
                            <span className="text-muted-foreground">Branch:</span> {account.branchName}
                          </p>
                        )}
                        {account.branchCode && (
                          <p className="text-sm">
                            <span className="text-muted-foreground">Branch Code:</span> {account.branchCode}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEditAccount(account)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteAccount(account.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 space-y-4">
              <div className="text-center">
                <CreditCard className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-lg font-medium">No Bank Accounts</h3>
                <p className="text-sm text-muted-foreground">Add a bank account to receive payments</p>
              </div>
              <Button onClick={handleAddAccount}>
                <Plus className="mr-2 h-4 w-4" /> Add Bank Account
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md md:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingAccount ? "Edit Bank Account" : "Add Bank Account"}</DialogTitle>
            <DialogDescription>
              {editingAccount ? "Update the bank account details below" : "Enter the bank account details below"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="accountName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Account holder name" {...field} />
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
                        <Input placeholder="Account number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Bank name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="accountType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select account type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="checking">Checking</SelectItem>
                          <SelectItem value="savings">Savings</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="routingNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Routing Number / IBAN</FormLabel>
                      <FormControl>
                        <Input placeholder="Routing number or IBAN" {...field} />
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
                      <FormLabel>Swift Code (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Swift code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="branchName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Branch Name (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Branch name" {...field} />
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
                      <FormLabel>Branch Code (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Branch code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Default Account</FormLabel>
                      <FormDescription>Make this the default account for receiving payments</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingAccount ? "Updating..." : "Adding..."}
                    </>
                  ) : (
                    <>{editingAccount ? "Update Account" : "Add Account"}</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

