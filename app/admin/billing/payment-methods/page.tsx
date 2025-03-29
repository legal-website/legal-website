"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"
import { Loader2, Plus, Settings, Trash2, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Define the form schema
const bankAccountSchema = z.object({
  accountName: z.string().min(2, { message: "Account name is required" }),
  accountNumber: z.string().min(8, { message: "Valid account number is required" }),
  routingNumber: z.string().min(9, { message: "Valid routing number is required" }),
  bankName: z.string().min(2, { message: "Bank name is required" }),
  accountType: z.enum(["checking", "savings"], {
    required_error: "Please select an account type",
  }),
  swiftCode: z.string().optional(),
  branchName: z.string().optional(),
  branchCode: z.string().optional(),
  isDefault: z.boolean().default(false),
})

type BankAccount = z.infer<typeof bankAccountSchema> & {
  id: string
  createdAt: string
  updatedAt: string
  createdBy: string
}

export default function BankAccountsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Initialize form
  const form = useForm<z.infer<typeof bankAccountSchema>>({
    resolver: zodResolver(bankAccountSchema),
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
  useEffect(() => {
    const fetchBankAccounts = async () => {
      setIsLoading(true)
      try {
        const response = await fetch("/api/admin/bank-accounts")
        if (response.ok) {
          const data = await response.json()
          setBankAccounts(data.bankAccounts)
        }
      } catch (error) {
        console.error("Error fetching bank accounts:", error)
        toast.error("Failed to load bank accounts")
      } finally {
        setIsLoading(false)
      }
    }

    fetchBankAccounts()
  }, [])

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof bankAccountSchema>) => {
    setIsSaving(true)
    try {
      const url = selectedAccount ? `/api/user/bank-details?id=${selectedAccount.id}` : "/api/user/bank-details"

      const method = selectedAccount ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(selectedAccount ? { ...data, id: selectedAccount.id } : data),
      })

      if (response.ok) {
        const result = await response.json()

        if (selectedAccount) {
          setBankAccounts((prev) => {
            const updated = prev.map((account) => (account.id === selectedAccount.id ? result.bankDetails : account))

            // If the updated account is now default, make sure others are not
            if (data.isDefault) {
              return updated.map((account) =>
                account.id !== selectedAccount.id ? { ...account, isDefault: false } : account,
              )
            }

            return updated
          })
          toast.success("Bank account updated")
        } else {
          setBankAccounts((prev) => {
            const newAccounts = [...prev, result.bankDetails]

            // If the new account is default, make sure others are not
            if (data.isDefault) {
              return newAccounts.map((account) =>
                account.id !== result.bankDetails.id ? { ...account, isDefault: false } : account,
              )
            }

            return newAccounts
          })
          toast.success("Bank account added")
        }

        setIsDialogOpen(false)
        setSelectedAccount(null)
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
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || "Failed to save bank account")
      }
    } catch (error) {
      console.error("Error saving bank account:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setIsSaving(false)
    }
  }

  // Handle bank account deletion
  const handleDelete = async () => {
    if (!selectedAccount) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/user/bank-details?id=${selectedAccount.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setBankAccounts((prev) => prev.filter((account) => account.id !== selectedAccount.id))
        toast.success("Bank account deleted")
        setIsDeleteDialogOpen(false)
        setSelectedAccount(null)
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || "Failed to delete bank account")
      }
    } catch (error) {
      console.error("Error deleting bank account:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle edit button click
  const handleEdit = (account: BankAccount) => {
    setSelectedAccount(account)
    form.reset({
      accountName: account.accountName,
      accountNumber: account.accountNumber,
      routingNumber: account.routingNumber,
      bankName: account.bankName,
      accountType: account.accountType,
      swiftCode: account.swiftCode || "",
      branchName: account.branchName || "",
      branchCode: account.branchCode || "",
      isDefault: account.isDefault || false,
    })
    setIsDialogOpen(true)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Bank Accounts</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setSelectedAccount(null)
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
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Bank Account
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedAccount ? "Edit Bank Account" : "Add Bank Account"}</DialogTitle>
              <DialogDescription>
                {selectedAccount
                  ? "Update the bank account details below"
                  : "Fill in the details to add a new bank account"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="accountName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Holder Name</FormLabel>
                      <FormControl>
                        <Input placeholder="ORIZEN INC" {...field} />
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
                        <Input placeholder="08751010024993" {...field} />
                      </FormControl>
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
                        <Input placeholder="PK51ALFH0875001010024993" {...field} />
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
                        <Input placeholder="Bank Alfalah" {...field} />
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
                  name="swiftCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Swift Code</FormLabel>
                      <FormControl>
                        <Input placeholder="ALFHPKKAXXX" {...field} />
                      </FormControl>
                      <FormDescription>Optional international bank code</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="branchName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Branch Name</FormLabel>
                      <FormControl>
                        <Input placeholder="EME DHA Br.LHR" {...field} />
                      </FormControl>
                      <FormDescription>Optional branch name</FormDescription>
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
                        <Input placeholder="0875" {...field} />
                      </FormControl>
                      <FormDescription>Optional branch code</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isDefault"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Set as Default Account</FormLabel>
                        <FormDescription>This account will be shown to clients for payments</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : selectedAccount ? (
                      "Update Account"
                    ) : (
                      "Add Account"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Bank Accounts</CardTitle>
          <CardDescription>Manage the bank accounts that clients can use for payments</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : bankAccounts.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No bank accounts found</p>
              <Button variant="outline" className="mt-4" onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Bank Account
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Default</TableHead>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Bank Name</TableHead>
                  <TableHead>Account Number</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bankAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>
                      {account.isDefault && (
                        <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                          <Check className="h-3 w-3 mr-1" />
                          Default
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{account.accountName}</TableCell>
                    <TableCell>{account.bankName}</TableCell>
                    <TableCell>•••• {account.accountNumber.slice(-4)}</TableCell>
                    <TableCell>{formatDate(account.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(account)}>
                          <Settings className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <AlertDialog
                          open={isDeleteDialogOpen && selectedAccount?.id === account.id}
                          onOpenChange={(open) => {
                            setIsDeleteDialogOpen(open)
                            if (!open) setSelectedAccount(null)
                          }}
                        >
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedAccount(account)}
                              disabled={account.isDefault}
                              title={account.isDefault ? "Cannot delete default account" : "Delete account"}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Bank Account</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the "{account.accountName}" bank account? This action
                                cannot be undone.
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
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

