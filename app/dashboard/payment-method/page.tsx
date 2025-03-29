"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"
import { Building, CreditCard, Loader2, PlusCircle, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

// Define the form schema
const bankDetailsSchema = z.object({
  accountName: z.string().min(2, { message: "Account name is required" }),
  accountNumber: z.string().min(8, { message: "Valid account number is required" }),
  routingNumber: z.string().min(9, { message: "Valid routing number is required" }),
  bankName: z.string().min(2, { message: "Bank name is required" }),
  accountType: z.enum(["checking", "savings"], {
    required_error: "Please select an account type",
  }),
})

type BankDetails = z.infer<typeof bankDetailsSchema> & {
  swiftCode?: string
  branchName?: string
  branchCode?: string
}

export default function PaymentMethodPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null)

  // Initialize form
  const form = useForm<BankDetails>({
    resolver: zodResolver(bankDetailsSchema),
    defaultValues: {
      accountName: "",
      accountNumber: "",
      routingNumber: "",
      bankName: "",
      accountType: "checking",
    },
  })

  // Fetch existing bank details
  useEffect(() => {
    const fetchBankDetails = async () => {
      setIsLoading(true)
      try {
        const response = await fetch("/api/user/bank-details")
        if (response.ok) {
          const data = await response.json()
          if (data.bankDetails) {
            setBankDetails(data.bankDetails)
            form.reset(data.bankDetails)
          }
        }
      } catch (error) {
        console.error("Error fetching bank details:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBankDetails()
  }, [form])

  // Handle form submission
  const onSubmit = async (data: BankDetails) => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/user/bank-details", {
        method: bankDetails ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast.success(bankDetails ? "Bank details updated" : "Bank details added")
        setBankDetails(data)
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || "Failed to save bank details")
      }
    } catch (error) {
      console.error("Error saving bank details:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setIsSaving(false)
    }
  }

  // Handle bank details deletion
  const handleDelete = async () => {
    if (!bankDetails) return

    setIsDeleting(true)
    try {
      const response = await fetch("/api/user/bank-details", {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Bank details removed")
        setBankDetails(null)
        form.reset({
          accountName: "",
          accountNumber: "",
          routingNumber: "",
          bankName: "",
          accountType: "checking",
        })
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || "Failed to remove bank details")
      }
    } catch (error) {
      console.error("Error removing bank details:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setIsDeleting(false)
    }
  }

  // Mask account number for display
  const maskAccountNumber = (accountNumber: string) => {
    if (!accountNumber) return ""
    return "•••• " + accountNumber.slice(-4)
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Payment Methods</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Bank Account Details
            </CardTitle>
            <CardDescription>Add your bank account details for direct deposits and payments</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : bankDetails ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Account Title</p>
                    <p className="text-lg font-medium">{bankDetails.accountName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Account Number</p>
                    <p className="text-lg font-medium">{maskAccountNumber(bankDetails.accountNumber)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Bank Name</p>
                    <p className="text-lg font-medium">{bankDetails.bankName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Account Type</p>
                    <p className="text-lg font-medium capitalize">{bankDetails.accountType}</p>
                  </div>
                  {bankDetails.swiftCode && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Swift Code</p>
                      <p className="text-lg font-medium">{bankDetails.swiftCode}</p>
                    </div>
                  )}
                  {bankDetails.branchName && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Branch Name</p>
                      <p className="text-lg font-medium">{bankDetails.branchName}</p>
                    </div>
                  )}
                  {bankDetails.branchCode && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Branch Code</p>
                      <p className="text-lg font-medium">{bankDetails.branchCode}</p>
                    </div>
                  )}
                  {bankDetails.routingNumber && bankDetails.routingNumber.startsWith("PK") && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">IBAN</p>
                      <p className="text-lg font-medium">{bankDetails.routingNumber}</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" onClick={() => form.reset(bankDetails)}>
                    Edit Details
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove Bank Account</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to remove your bank account details? This action cannot be undone.
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
                              Removing...
                            </>
                          ) : (
                            "Remove"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 space-y-4">
                <div className="text-center">
                  <CreditCard className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-lg font-medium">No Bank Account Added</h3>
                  <p className="text-sm text-muted-foreground">
                    Add your bank account details for payments and withdrawals
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{bankDetails ? "Edit Bank Account" : "Add Bank Account"}</CardTitle>
            <CardDescription>
              {bankDetails ? "Update your bank account information" : "Enter your bank account details for payments"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="accountName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Holder Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
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
                        <Input placeholder="123456789" {...field} />
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
                        <Input placeholder="123456789" {...field} />
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
                        <Input placeholder="Bank of America" {...field} />
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
                <Button type="submit" className="w-full" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : bankDetails ? (
                    "Update Bank Account"
                  ) : (
                    <>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Bank Account
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

