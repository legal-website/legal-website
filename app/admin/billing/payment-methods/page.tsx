"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"
import { Loader2, Plus, Settings, Trash2 } from "lucide-react"

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
import { Switch } from "@/components/ui/switch"
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
import { CustomBadge as Badge } from "@/components/ui/custom-badge"

// Define the form schema
const paymentMethodSchema = z.object({
  name: z.string().min(2, { message: "Name is required" }),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
})

type PaymentMethod = z.infer<typeof paymentMethodSchema> & {
  id: string
  createdAt: string
  updatedAt: string
  createdBy: string
}

export default function PaymentMethodsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Initialize form
  const form = useForm<z.infer<typeof paymentMethodSchema>>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      name: "",
      description: "",
      isActive: true,
    },
  })

  // Fetch payment methods
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      setIsLoading(true)
      try {
        const response = await fetch("/api/admin/payment-methods")
        if (response.ok) {
          const data = await response.json()
          setPaymentMethods(data.paymentMethods)
        }
      } catch (error) {
        console.error("Error fetching payment methods:", error)
        toast.error("Failed to load payment methods")
      } finally {
        setIsLoading(false)
      }
    }

    fetchPaymentMethods()
  }, [])

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof paymentMethodSchema>) => {
    setIsSaving(true)
    try {
      const url = selectedMethod ? `/api/admin/payment-methods/${selectedMethod.id}` : "/api/admin/payment-methods"

      const method = selectedMethod ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const result = await response.json()

        if (selectedMethod) {
          setPaymentMethods((prev) =>
            prev.map((method) => (method.id === selectedMethod.id ? result.paymentMethod : method)),
          )
          toast.success("Payment method updated")
        } else {
          setPaymentMethods((prev) => [...prev, result.paymentMethod])
          toast.success("Payment method added")
        }

        setIsDialogOpen(false)
        setSelectedMethod(null)
        form.reset({
          name: "",
          description: "",
          isActive: true,
        })
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || "Failed to save payment method")
      }
    } catch (error) {
      console.error("Error saving payment method:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setIsSaving(false)
    }
  }

  // Handle payment method deletion
  const handleDelete = async () => {
    if (!selectedMethod) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/payment-methods/${selectedMethod.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setPaymentMethods((prev) => prev.filter((method) => method.id !== selectedMethod.id))
        toast.success("Payment method deleted")
        setIsDeleteDialogOpen(false)
        setSelectedMethod(null)
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || "Failed to delete payment method")
      }
    } catch (error) {
      console.error("Error deleting payment method:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle edit button click
  const handleEdit = (method: PaymentMethod) => {
    setSelectedMethod(method)
    form.reset({
      name: method.name,
      description: method.description || "",
      isActive: method.isActive,
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
        <h1 className="text-3xl font-bold tracking-tight">Payment Methods</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setSelectedMethod(null)
                form.reset({
                  name: "",
                  description: "",
                  isActive: true,
                })
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Payment Method
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedMethod ? "Edit Payment Method" : "Add Payment Method"}</DialogTitle>
              <DialogDescription>
                {selectedMethod
                  ? "Update the payment method details below"
                  : "Fill in the details to add a new payment method"}
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
                        <Input placeholder="Credit Card" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Payment via credit card" {...field} />
                      </FormControl>
                      <FormDescription>Optional description of the payment method</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>Enable or disable this payment method</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
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
                    ) : selectedMethod ? (
                      "Update Method"
                    ) : (
                      "Add Method"
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
          <CardTitle>Available Payment Methods</CardTitle>
          <CardDescription>Manage the payment methods available to your customers</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : paymentMethods.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No payment methods found</p>
              <Button variant="outline" className="mt-4" onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Payment Method
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentMethods.map((method) => (
                  <TableRow key={method.id}>
                    <TableCell className="font-medium">{method.name}</TableCell>
                    <TableCell>{method.description || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={method.isActive ? "success" : "secondary"}>
                        {method.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(method.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(method)}>
                          <Settings className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <AlertDialog
                          open={isDeleteDialogOpen && selectedMethod?.id === method.id}
                          onOpenChange={(open) => {
                            setIsDeleteDialogOpen(open)
                            if (!open) setSelectedMethod(null)
                          }}
                        >
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedMethod(method)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Payment Method</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the "{method.name}" payment method? This action cannot
                                be undone.
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

