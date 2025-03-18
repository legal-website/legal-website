"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { AlertCircle, CalendarIcon, CheckCircle, Download, FileText, Upload } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

// Types
interface Deadline {
  id: string
  title: string
  description: string
  dueDate: string
  fee: number
  lateFee: number
  status: "pending" | "completed" | "overdue"
}

interface Filing {
  id: string
  deadlineId: string
  deadlineTitle: string
  receiptUrl: string | null
  reportUrl: string | null
  status: "pending_payment" | "payment_received" | "completed" | "rejected"
  userNotes: string | null
  adminNotes: string | null
  filedDate: string | null
  dueDate: string
}

interface FilingRequirement {
  title: string
  description: string
  details: string | null
}

export default function AnnualReportsPage() {
  const { toast } = useToast()
  const { data: session } = useSession()
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Data states
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<Deadline[]>([])
  const [pastFilings, setPastFilings] = useState<Filing[]>([])
  const [requirements, setRequirements] = useState<FilingRequirement[]>([])

  // Dialog states
  const [showFileDialog, setShowFileDialog] = useState(false)
  const [showViewFilingDialog, setShowViewFilingDialog] = useState(false)

  // Selected items
  const [selectedDeadline, setSelectedDeadline] = useState<Deadline | null>(null)
  const [selectedFiling, setSelectedFiling] = useState<Filing | null>(null)

  // Form data
  const [filingForm, setFilingForm] = useState({
    receiptFile: null as File | null,
    notes: "",
  })

  // Calendar highlight dates
  const [highlightDates, setHighlightDates] = useState<Date[]>([])

  // Fetch data on component mount
  useEffect(() => {
    fetchData()

    // Set up auto-refresh every 5 minutes
    const interval = setInterval(
      () => {
        fetchData(false)
      },
      5 * 60 * 1000,
    )

    return () => clearInterval(interval)
  }, [])

  // Fetch all necessary data
  const fetchData = async (showToast = true) => {
    setLoading(true)
    if (showToast) setRefreshing(true)

    try {
      // In a real implementation, you would fetch data from your API
      // For now, we'll use mock data

      // Mock upcoming deadlines
      const mockDeadlines: Deadline[] = [
        {
          id: "1",
          title: "Annual Report Filing",
          description: "2024 Annual Report Filing",
          dueDate: "2024-07-15T00:00:00.000Z",
          fee: 75.0,
          lateFee: 25.0,
          status: "pending",
        },
        {
          id: "2",
          title: "Tax Filing Deadline",
          description: "2024 Tax Filing",
          dueDate: "2024-09-30T00:00:00.000Z",
          fee: 150.0,
          lateFee: 50.0,
          status: "pending",
        },
      ]
      setUpcomingDeadlines(mockDeadlines)

      // Mock past filings
      const mockFilings: Filing[] = [
        {
          id: "1",
          deadlineId: "past1",
          deadlineTitle: "Annual Report 2023",
          receiptUrl: "/placeholder.svg?height=300&width=300",
          reportUrl: "/placeholder.svg?height=300&width=300",
          status: "completed",
          userNotes: "Submitted via online portal",
          adminNotes: "Approved and filed on time",
          filedDate: "2023-07-10T00:00:00.000Z",
          dueDate: "2023-07-15T00:00:00.000Z",
        },
        {
          id: "2",
          deadlineId: "past2",
          deadlineTitle: "Annual Report 2022",
          receiptUrl: "/placeholder.svg?height=300&width=300",
          reportUrl: "/placeholder.svg?height=300&width=300",
          status: "completed",
          userNotes: "Submitted with payment confirmation",
          adminNotes: "Verified and processed",
          filedDate: "2022-07-12T00:00:00.000Z",
          dueDate: "2022-07-15T00:00:00.000Z",
        },
      ]
      setPastFilings(mockFilings)

      // Mock filing requirements
      const mockRequirements: FilingRequirement[] = [
        {
          title: "Annual Report",
          description:
            "Your company is required to file an annual report with the Secretary of State by July 15 each year.",
          details:
            "Filing fee: $75.00\nLate fee: $25.00 per month\nRequired information: Company address, registered agent, officer information",
        },
        {
          title: "Tax Filings",
          description:
            "Annual tax filings are due by September 30. Consult with your accountant for specific requirements.",
          details: null,
        },
      ]
      setRequirements(mockRequirements)

      // Set calendar highlight dates
      const dates = mockDeadlines.map((deadline) => new Date(deadline.dueDate))
      setHighlightDates(dates)

      if (showToast && refreshing) {
        toast({
          title: "Refreshed",
          description: "Annual reports data has been refreshed.",
        })
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      if (showToast) {
        toast({
          title: "Error",
          description: "Failed to load annual reports data. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
      if (showToast) setRefreshing(false)
    }
  }

  // Handle file now button click
  const handleFileNow = (deadline: Deadline) => {
    setSelectedDeadline(deadline)
    setFilingForm({
      receiptFile: null,
      notes: "",
    })
    setShowFileDialog(true)
  }

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFilingForm({
        ...filingForm,
        receiptFile: e.target.files[0],
      })
    }
  }

  // Handle filing submission
  const handleSubmitFiling = async () => {
    if (!selectedDeadline) return
    if (!filingForm.receiptFile) {
      toast({
        title: "Missing Receipt",
        description: "Please upload a payment receipt to continue.",
        variant: "destructive",
      })
      return
    }

    try {
      // In a real implementation, you would upload the file and submit the filing
      // For now, we'll simulate a successful submission

      toast({
        title: "Filing Submitted",
        description: "Your payment receipt has been submitted successfully. We will process your filing shortly.",
      })

      setShowFileDialog(false)

      // Refresh data
      fetchData()
    } catch (error) {
      console.error("Error submitting filing:", error)
      toast({
        title: "Error",
        description: "Failed to submit filing. Please try again.",
        variant: "destructive",
      })
    }
  }

  // View filing details
  const handleViewFiling = (filing: Filing) => {
    setSelectedFiling(filing)
    setShowViewFilingDialog(true)
  }

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    return format(new Date(dateString), "MMMM d, yyyy")
  }

  // Calculate days left
  const calculateDaysLeft = (dueDate: string) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      case "pending_payment":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
      case "payment_received":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
    }
  }

  if (loading && upcomingDeadlines.length === 0 && pastFilings.length === 0) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 h-full w-full animate-spin rounded-full border-4 border-t-4 border-[#22c984] border-t-transparent"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-[#22c984]" />
            </div>
          </div>
          <p className="text-base font-medium text-muted-foreground">Loading annual reports data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 mb-40">
      <h1 className="text-3xl font-bold mb-6">Annual Reports</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <Card className="p-6 mb-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-2 bg-green-100 rounded-lg">
                <CalendarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-1">Annual Report Calendar</h3>
                <p className="text-gray-600">Track your filing deadlines</p>
              </div>
            </div>

            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
              weekStartsOn={0}
              modifiers={{
                booked: highlightDates,
                today: new Date(),
              }}
              modifiersStyles={{
                booked: { border: "2px solid red", borderRadius: "50%" },
              }}
            />
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Upcoming Deadlines</h3>
            {upcomingDeadlines.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No upcoming deadlines at this time.</div>
            ) : (
              <div className="space-y-4">
                {upcomingDeadlines.map((deadline) => {
                  const daysLeft = calculateDaysLeft(deadline.dueDate)
                  const isUrgent = daysLeft <= 30

                  return (
                    <div key={deadline.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          {isUrgent ? (
                            <AlertCircle className="h-5 w-5 text-red-500" />
                          ) : (
                            <CalendarIcon className="h-5 w-5 text-[#22c984]" />
                          )}
                          <h4 className="font-medium">{deadline.title}</h4>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            isUrgent ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {daysLeft} days left
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{deadline.description}</p>
                      <p className="text-sm text-gray-600 mb-3">
                        Due: {formatDate(deadline.dueDate)} | Fee: ${deadline.fee.toFixed(2)}
                      </p>
                      <div className="mt-3">
                        <Button size="sm" onClick={() => handleFileNow(deadline)}>
                          File Now
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>

        <div>
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Filing Requirements</h3>
            <div className="space-y-4">
              {requirements.map((requirement, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">{requirement.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{requirement.description}</p>
                  {requirement.details && (
                    <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
                      {requirement.details.split("\n").map((detail, i) => (
                        <li key={i}>{detail}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Past Filings</h3>
            {pastFilings.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No past filings found.</div>
            ) : (
              <div className="space-y-4">
                {pastFilings.map((filing) => (
                  <div key={filing.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{filing.deadlineTitle}</p>
                        <p className="text-xs text-gray-600">Filed on: {formatDate(filing.filedDate || "")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Filed
                      </span>
                      {filing.reportUrl && (
                        <Button variant="ghost" size="icon" asChild>
                          <a href={filing.reportUrl} target="_blank" rel="noopener noreferrer" download>
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => handleViewFiling(filing)}>
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* File Now Dialog */}
      {selectedDeadline && (
        <Dialog open={showFileDialog} onOpenChange={setShowFileDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>File Annual Report</DialogTitle>
              <DialogDescription>Submit your payment receipt for {selectedDeadline.title}</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div>
                <Label className="mb-2 block">Deadline Information</Label>
                <div className="p-3 bg-gray-50 rounded-md text-sm">
                  <p>
                    <strong>Title:</strong> {selectedDeadline.title}
                  </p>
                  <p>
                    <strong>Due Date:</strong> {formatDate(selectedDeadline.dueDate)}
                  </p>
                  <p>
                    <strong>Fee:</strong> ${selectedDeadline.fee.toFixed(2)}
                  </p>
                  {selectedDeadline.lateFee > 0 && (
                    <p>
                      <strong>Late Fee:</strong> ${selectedDeadline.lateFee.toFixed(2)} per month
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="receipt" className="mb-2 block">
                  Upload Payment Receipt
                </Label>
                <div className="border-2 border-dashed rounded-md p-6 text-center">
                  <input
                    type="file"
                    id="receipt"
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="receipt" className="cursor-pointer">
                    <div className="flex flex-col items-center">
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm font-medium mb-1">Click to upload</p>
                      <p className="text-xs text-gray-500">PNG, JPG, or PDF (max 10MB)</p>
                    </div>
                  </label>
                  {filingForm.receiptFile && (
                    <div className="mt-4 p-2 bg-green-50 rounded text-sm text-green-700 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {filingForm.receiptFile.name}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="notes" className="mb-2 block">
                  Notes (Optional)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about your payment or filing"
                  value={filingForm.notes}
                  onChange={(e) => setFilingForm({ ...filingForm, notes: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowFileDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitFiling}>Submit Filing</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* View Filing Dialog */}
      {selectedFiling && (
        <Dialog open={showViewFilingDialog} onOpenChange={setShowViewFilingDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Filing Details</DialogTitle>
              <DialogDescription>View details for {selectedFiling.deadlineTitle}</DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium mb-1">Status</h3>
                  <Badge className={getStatusBadgeColor(selectedFiling.status)}>
                    {selectedFiling.status === "completed"
                      ? "Completed"
                      : selectedFiling.status
                          .split("_")
                          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(" ")}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-1">Filed Date</h3>
                  <p>{selectedFiling.filedDate ? formatDate(selectedFiling.filedDate) : "Not filed yet"}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-1">Due Date</h3>
                  <p>{formatDate(selectedFiling.dueDate)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedFiling.receiptUrl && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Your Payment Receipt</h3>
                    <div className="border rounded-md p-2 h-48 flex items-center justify-center">
                      <img
                        src={selectedFiling.receiptUrl || "/placeholder.svg"}
                        alt="Payment Receipt"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="mt-2 flex justify-end">
                      <Button variant="outline" size="sm" asChild>
                        <a href={selectedFiling.receiptUrl} target="_blank" rel="noopener noreferrer" download>
                          <Download className="h-4 w-4 mr-2" />
                          Download Receipt
                        </a>
                      </Button>
                    </div>
                  </div>
                )}

                {selectedFiling.reportUrl && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Filed Report</h3>
                    <div className="border rounded-md p-2 h-48 flex items-center justify-center">
                      <FileText className="h-16 w-16 text-gray-300" />
                    </div>
                    <div className="mt-2 flex justify-end">
                      <Button variant="outline" size="sm" asChild>
                        <a href={selectedFiling.reportUrl} target="_blank" rel="noopener noreferrer" download>
                          <Download className="h-4 w-4 mr-2" />
                          Download Report
                        </a>
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedFiling.userNotes && (
                  <div>
                    <h3 className="text-sm font-medium mb-1">Your Notes</h3>
                    <p className="text-sm p-3 bg-gray-50 rounded-md">{selectedFiling.userNotes}</p>
                  </div>
                )}

                {selectedFiling.adminNotes && (
                  <div>
                    <h3 className="text-sm font-medium mb-1">Admin Notes</h3>
                    <p className="text-sm p-3 bg-gray-50 rounded-md">{selectedFiling.adminNotes}</p>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => setShowViewFilingDialog(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

