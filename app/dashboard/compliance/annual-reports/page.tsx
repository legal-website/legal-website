"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, CalendarIcon, CheckCircle, Download, FileText, Upload, RefreshCw } from "lucide-react"
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
import { CustomCalendar } from "@/components/custom-calendar"

// Types
interface Deadline {
  id: string
  title: string
  description: string | null
  dueDate: string
  fee: number
  lateFee: number | null
  status: string
}

interface Filing {
  id: string
  deadlineId: string
  deadlineTitle?: string
  receiptUrl: string | null
  reportUrl: string | null
  status: string
  userNotes: string | null
  adminNotes: string | null
  filedDate: string | null
  dueDate?: string
  createdAt?: string
  deadline?: {
    title: string
    dueDate: string
  } | null
}

interface FilingRequirement {
  id: string
  title: string
  description: string
  details: string | null
  isActive: boolean
}

export default function AnnualReportsPage() {
  const { toast } = useToast()
  const { data: session } = useSession()
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [backgroundRefreshing, setBackgroundRefreshing] = useState(false)
  const [submitting, setSubmitting] = useState(false) // Add submitting state

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

  // Selected date info
  const [selectedDateInfo, setSelectedDateInfo] = useState<Deadline | null>(null)

  // Fetch data on component mount
  useEffect(() => {
    fetchData()

    // Set up auto-refresh every 5 minutes
    const interval = setInterval(
      () => {
        fetchData(false, true) // Use background refresh for auto-refresh
      },
      5 * 60 * 1000,
    )

    return () => clearInterval(interval)
  }, [])

  // Update selected date info when date changes
  useEffect(() => {
    if (date && upcomingDeadlines.length > 0) {
      const formattedDate = format(date, "yyyy-MM-dd")
      console.log("Looking for deadline on date:", formattedDate)
      console.log(
        "Available deadlines:",
        upcomingDeadlines.map((d) => ({
          id: d.id,
          title: d.title,
          date: format(new Date(d.dueDate), "yyyy-MM-dd"),
        })),
      )

      const deadlineOnDate = upcomingDeadlines.find(
        (deadline: Deadline) => format(new Date(deadline.dueDate), "yyyy-MM-dd") === formattedDate,
      )

      console.log("Found deadline for selected date:", deadlineOnDate)
      setSelectedDateInfo(deadlineOnDate || null)
    } else {
      setSelectedDateInfo(null)
    }
  }, [date, upcomingDeadlines])

  // Fetch all necessary data
  const fetchData = async (showToast = true, isBackground = false) => {
    if (!isBackground) {
      setLoading(true)
    }
    if (showToast && !isBackground) setRefreshing(true)
    if (isBackground) setBackgroundRefreshing(true)

    try {
      // Fetch deadlines
      const deadlinesResponse = await fetch("/api/annual-reports/deadlines")
      if (!deadlinesResponse.ok) throw new Error("Failed to fetch deadlines")
      const deadlinesData = await deadlinesResponse.json()

      console.log("Dashboard: Fetched deadlines:", deadlinesData.deadlines?.length || 0)

      // Fetch filings
      const filingsResponse = await fetch("/api/annual-reports/filings")
      if (!filingsResponse.ok) throw new Error("Failed to fetch filings")
      const filingsData = await filingsResponse.json()

      console.log("Dashboard: Fetched filings:", filingsData.filings?.length || 0)

      // Process filings to ensure they have the right format
      const processedFilings =
        filingsData.filings?.map((filing: Filing) => {
          // Find the associated deadline from deadlinesData
          const deadline = deadlinesData.deadlines?.find((d: Deadline) => d.id === filing.deadlineId)

          return {
            ...filing,
            deadlineTitle: filing.deadlineTitle || (deadline ? deadline.title : "Unknown Deadline"),
            dueDate: filing.dueDate || (deadline ? deadline.dueDate : null),
            deadline: deadline
              ? {
                  title: deadline.title,
                  dueDate: deadline.dueDate,
                }
              : filing.deadline || null,
          }
        }) || []

      console.log("Dashboard: Processed filings:", processedFilings.length)

      // Update deadline statuses based on filings
      let updatedDeadlines = deadlinesData.deadlines || []
      console.log("Dashboard: Initial deadlines count:", updatedDeadlines.length)

      if (processedFilings.length > 0 && updatedDeadlines.length > 0) {
        // Create a map of the latest filing status for each deadline
        const deadlineFilingStatusMap = new Map()

        processedFilings.forEach((filing: Filing) => {
          // Only update if this is a newer filing or we don't have one yet
          if (
            !deadlineFilingStatusMap.has(filing.deadlineId) ||
            new Date(filing.createdAt || 0) > new Date(deadlineFilingStatusMap.get(filing.deadlineId)?.createdAt || 0)
          ) {
            deadlineFilingStatusMap.set(filing.deadlineId, filing)
          }
        })

        // Update deadline statuses based on filing statuses
        updatedDeadlines = updatedDeadlines.map((deadline: Deadline) => {
          const latestFiling = deadlineFilingStatusMap.get(deadline.id)

          if (latestFiling) {
            // If there's a filing, update the deadline status based on the filing status
            return { ...deadline, status: latestFiling.status }
          }

          // If no filing or status doesn't need updating, return the original deadline
          return deadline
        })

        console.log("Dashboard: Updated deadlines with filing statuses")
      }

      // Filter out completed or rejected deadlines from upcoming deadlines
      const filteredDeadlines = updatedDeadlines.filter(
        (deadline: Deadline) => deadline.status !== "completed" && deadline.status !== "rejected",
      )

      console.log("Dashboard: Filtered deadlines count:", filteredDeadlines.length)
      setUpcomingDeadlines(filteredDeadlines)

      // Separate past filings (only completed or closed)
      const pastFilingsData = processedFilings.filter(
        (filing: Filing) => filing.status === "completed" || filing.status === "closed",
      )

      console.log("Dashboard: Past filings found:", pastFilingsData.length)
      setPastFilings(pastFilingsData)

      // Fetch requirements
      const requirementsResponse = await fetch("/api/annual-reports/requirements")
      if (!requirementsResponse.ok) throw new Error("Failed to fetch requirements")
      const requirementsData = await requirementsResponse.json()
      console.log("Dashboard: Fetched requirements:", requirementsData.requirements?.length || 0)
      setRequirements(requirementsData.requirements || [])

      // Set calendar highlight dates - only for deadlines that are not completed or rejected
      const activeDates =
        updatedDeadlines
          ?.filter((deadline: Deadline) => deadline.status !== "completed" && deadline.status !== "rejected")
          .map((deadline: Deadline) => new Date(deadline.dueDate)) || []

      setHighlightDates(activeDates)

      if (showToast && !isBackground && refreshing) {
        toast({
          title: "Refreshed",
          description: "Annual reports data has been refreshed.",
        })
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      if (showToast && !isBackground) {
        toast({
          title: "Error",
          description: "Failed to load annual reports data. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      if (!isBackground) {
        setLoading(false)
      }
      if (showToast && !isBackground) setRefreshing(false)
      setBackgroundRefreshing(false)
    }
  }

  // Handle file now button click
  const handleFileNow = (deadline: Deadline) => {
    console.log("Filing for deadline:", deadline)
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

    setSubmitting(true) // Set submitting state to true

    try {
      // First upload the receipt file
      const formData = new FormData()
      formData.append("receipt", filingForm.receiptFile)

      console.log("Uploading receipt:", filingForm.receiptFile.name, "Size:", filingForm.receiptFile.size)

      const uploadResponse = await fetch("/api/upload-receipt", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        console.error("Upload error:", errorData)
        throw new Error(errorData.message || "Failed to upload receipt")
      }

      const uploadData = await uploadResponse.json()
      console.log("Upload successful:", uploadData)

      // Now create the filing
      const filingData = {
        deadlineId: selectedDeadline.id,
        receiptUrl: uploadData.url,
        userNotes: filingForm.notes,
      }

      console.log("Submitting filing with data:", filingData)

      const filingResponse = await fetch("/api/annual-reports/filings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(filingData),
      })

      if (!filingResponse.ok) {
        const filingError = await filingResponse.json()
        console.error("Filing error:", filingError)
        throw new Error(filingError.message || "Failed to create filing")
      }

      const filingResult = await filingResponse.json()
      console.log("Filing created successfully:", filingResult)

      // Update the deadline status in the local state
      setUpcomingDeadlines((prevDeadlines) =>
        prevDeadlines.map((deadline) =>
          deadline.id === selectedDeadline.id ? { ...deadline, status: "pending_payment" } : deadline,
        ),
      )

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
        description: error instanceof Error ? error.message : "Failed to submit filing. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false) // Reset submitting state
    }
  }

  // View filing details
  const handleViewFiling = (filing: Filing) => {
    setSelectedFiling(filing)
    setShowViewFilingDialog(true)
  }

  // Format date
  const formatDate = (dateString: string | null | undefined) => {
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
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
    }
  }

  // Format status for display
  const formatStatus = (status: string) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  // Handle manual refresh
  const handleManualRefresh = () => {
    fetchData(true, false) // Show toast, not background
  }

  if (loading && upcomingDeadlines.length === 0 && pastFilings.length === 0) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 h-full w-full animate-spin rounded-full border-4 border-t-4 border-[#22c984] border-t-transparent"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <CalendarIcon className="h-6 w-6 text-[#22c984]" />
            </div>
          </div>
          <p className="text-base font-medium text-muted-foreground">Loading annual reports data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 mb-20 md:mb-40 overflow-hidden">
      {backgroundRefreshing && (
        <div className="fixed top-0 left-0 right-0 h-1 z-50">
          <div className="h-full bg-primary animate-pulse"></div>
        </div>
      )}
      <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Annual Reports</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 lg:gap-8">
        <div className="space-y-4 md:space-y-6">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 md:p-6">
              <div className="flex items-start gap-3 md:gap-4 mb-3 md:mb-4">
                <div className="p-2 bg-white rounded-lg shadow-sm flex-shrink-0">
                  <CalendarIcon className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-semibold mb-0.5 md:mb-1">Annual Report Calendar</h3>
                  <p className="text-sm md:text-base text-gray-600">Track your filing deadlines</p>
                </div>
              </div>
            </div>

            <div className="p-3 md:p-4 lg:p-6">
              <div className="max-w-full overflow-x-auto pb-2">
                <CustomCalendar value={date} onChange={setDate} highlightedDates={highlightDates} className="mb-4" />
              </div>

              {selectedDateInfo && (
                <div className="mt-3 md:mt-4 p-3 md:p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <h4 className="font-medium text-blue-800 mb-1 md:mb-2 text-sm md:text-base">
                    Deadline on {formatDate(selectedDateInfo.dueDate)}
                  </h4>
                  <p className="text-xs md:text-sm text-blue-700 mb-1 md:mb-2 break-words">{selectedDateInfo.title}</p>
                  {selectedDateInfo.description && (
                    <p className="text-xs md:text-sm text-blue-600 break-words">{selectedDateInfo.description}</p>
                  )}
                  <div className="mt-2 md:mt-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs md:text-sm font-medium text-blue-800">
                      Fee: ${Number(selectedDateInfo.fee).toFixed(2)}
                    </p>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleFileNow(selectedDateInfo)}
                      disabled={selectedDateInfo.status !== "pending"}
                      className="text-xs md:text-sm h-8 px-2 md:px-3"
                    >
                      {selectedDateInfo.status === "pending" ? "File Now" : formatStatus(selectedDateInfo.status)}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base md:text-lg font-semibold">Upcoming Deadlines</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleManualRefresh}
                disabled={refreshing || backgroundRefreshing}
                className="relative h-8 w-8 md:h-9 md:w-auto md:px-3"
              >
                <span className="sr-only md:not-sr-only md:mr-2">Refresh</span>
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              </Button>
            </div>
            {upcomingDeadlines.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm md:text-base">
                No upcoming deadlines at this time.
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4 max-h-[400px] overflow-y-auto pr-1">
                {upcomingDeadlines.map((deadline: Deadline) => {
                  const daysLeft = calculateDaysLeft(deadline.dueDate)
                  const isUrgent = daysLeft <= 30
                  const isPending = deadline.status === "pending"

                  return (
                    <div key={deadline.id} className="p-3 md:p-4 border rounded-lg hover:shadow-sm transition-shadow">
                      <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {isUrgent ? (
                            <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-red-500 flex-shrink-0" />
                          ) : (
                            <CalendarIcon className="h-4 w-4 md:h-5 md:w-5 text-[#22c984] flex-shrink-0" />
                          )}
                          <h4 className="font-medium text-sm md:text-base truncate">{deadline.title}</h4>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                              isUrgent ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {daysLeft} days left
                          </span>
                          {deadline.status && deadline.status !== "pending" && (
                            <Badge className={`text-xs ${getStatusBadgeColor(deadline.status)}`}>
                              {formatStatus(deadline.status)}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-xs md:text-sm text-gray-600 mb-1 line-clamp-2 break-words">
                        {deadline.description}
                      </p>
                      <p className="text-xs md:text-sm text-gray-600 mb-2">
                        Due: {formatDate(deadline.dueDate)} | Fee: ${Number(deadline.fee).toFixed(2)}
                      </p>
                      <div className="mt-2">
                        <Button
                          size="sm"
                          onClick={() => handleFileNow(deadline)}
                          disabled={!isPending}
                          className="h-8 text-xs md:text-sm"
                        >
                          {isPending ? "File Now" : formatStatus(deadline.status)}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4 md:space-y-6">
          <Card className="p-4 md:p-6">
            <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Filing Requirements</h3>
            <div className="space-y-3 md:space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {requirements.map((requirement: FilingRequirement) => (
                <div
                  key={requirement.id}
                  className="p-3 md:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <h4 className="font-medium text-sm md:text-base mb-1 md:mb-2">{requirement.title}</h4>
                  <p className="text-xs md:text-sm text-gray-600 mb-1 md:mb-2 break-words">{requirement.description}</p>
                  {requirement.details && (
                    <ul className="text-xs md:text-sm text-gray-600 list-disc pl-4 md:pl-5 space-y-0.5 md:space-y-1">
                      {requirement.details.split("\n").map((detail: string, i: number) => (
                        <li key={i} className="break-words">
                          {detail}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4 md:p-6">
            <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Past Filings</h3>
            {pastFilings.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm md:text-base">No past filings found.</div>
            ) : (
              <div className="space-y-3 md:space-y-4 max-h-[400px] overflow-y-auto pr-1">
                {pastFilings.map((filing: Filing) => {
                  const deadlineTitle =
                    filing.deadlineTitle || (filing.deadline ? filing.deadline.title : "Unknown Deadline")

                  return (
                    <div
                      key={filing.id}
                      className="flex flex-wrap md:flex-nowrap items-center justify-between p-3 md:p-4 border rounded-lg hover:shadow-sm transition-shadow gap-2 md:gap-3"
                    >
                      <div className="flex items-center gap-2 md:gap-3 min-w-0 w-full md:w-auto">
                        <FileText className="h-4 w-4 md:h-5 md:w-5 text-gray-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-sm md:text-base truncate">{deadlineTitle}</p>
                          <p className="text-xs text-gray-600">Filed on: {formatDate(filing.filedDate)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-auto">
                        {filing.reportUrl && (
                          <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                            <a href={filing.reportUrl} target="_blank" rel="noopener noreferrer" download>
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewFiling(filing)}
                          className="h-8 text-xs md:text-sm whitespace-nowrap"
                        >
                          View
                        </Button>
                        {filing.status === "completed" && (
                          <Badge
                            variant="outline"
                            className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 border-green-200 whitespace-nowrap"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Filed
                          </Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* File Now Dialog */}
      {selectedDeadline && (
        <Dialog open={showFileDialog} onOpenChange={setShowFileDialog}>
          <DialogContent className="sm:max-w-[500px] p-4 md:p-6 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg md:text-xl">File Annual Report</DialogTitle>
              <DialogDescription className="text-sm md:text-base">
                Submit your payment receipt for {selectedDeadline.title}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 md:gap-4 py-3 md:py-4">
              <div>
                <Label className="mb-1.5 md:mb-2 block text-sm md:text-base">Deadline Information</Label>
                <div className="p-2.5 md:p-3 bg-gray-50 rounded-md text-xs md:text-sm">
                  <p className="mb-1">
                    <strong>Title:</strong> {selectedDeadline.title}
                  </p>
                  <p className="mb-1">
                    <strong>Due Date:</strong> {formatDate(selectedDeadline.dueDate)}
                  </p>
                  <p className="mb-1">
                    <strong>Fee:</strong> ${Number(selectedDeadline.fee).toFixed(2)}
                  </p>
                  {selectedDeadline.lateFee && Number(selectedDeadline.lateFee) > 0 && (
                    <p>
                      <strong>Late Fee:</strong> ${Number(selectedDeadline.lateFee).toFixed(2)} per month
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="receipt" className="mb-1.5 md:mb-2 block text-sm md:text-base">
                  Upload Payment Receipt
                </Label>
                <div className="border-2 border-dashed rounded-md p-4 md:p-6 text-center">
                  <input
                    type="file"
                    id="receipt"
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    disabled={submitting}
                  />
                  <label htmlFor="receipt" className={`cursor-pointer ${submitting ? "opacity-50" : ""}`}>
                    <div className="flex flex-col items-center">
                      <Upload className="h-6 w-6 md:h-8 md:w-8 text-gray-400 mb-2" />
                      <p className="text-xs md:text-sm font-medium mb-1">Click to upload</p>
                      <p className="text-xs text-gray-500">PNG, JPG, or PDF (max 10MB)</p>
                    </div>
                  </label>
                  {filingForm.receiptFile && (
                    <div className="mt-3 md:mt-4 p-2 bg-green-50 rounded text-xs md:text-sm text-green-700 flex items-center">
                      <CheckCircle className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                      {filingForm.receiptFile.name}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="notes" className="mb-1.5 md:mb-2 block text-sm md:text-base">
                  Notes (Optional)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about your payment or filing"
                  value={filingForm.notes}
                  onChange={(e) => setFilingForm({ ...filingForm, notes: e.target.value })}
                  disabled={submitting}
                  className="text-xs md:text-sm min-h-[80px]"
                />
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setShowFileDialog(false)}
                disabled={submitting}
                className="w-full sm:w-auto text-xs md:text-sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitFiling}
                disabled={submitting || !filingForm.receiptFile}
                className="w-full sm:w-auto text-xs md:text-sm"
              >
                {submitting ? (
                  <>
                    <div className="mr-2 h-3 w-3 md:h-4 md:w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                    Submitting...
                  </>
                ) : (
                  "Submit Filing"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* View Filing Dialog */}
      {selectedFiling && (
        <Dialog open={showViewFilingDialog} onOpenChange={setShowViewFilingDialog}>
          <DialogContent className="sm:max-w-[600px] p-4 md:p-6 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg md:text-xl">Filing Details</DialogTitle>
              <DialogDescription className="text-sm md:text-base">
                View details for{" "}
                {selectedFiling.deadlineTitle ||
                  (selectedFiling.deadline ? selectedFiling.deadline.title : "Unknown Deadline")}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 md:gap-6 py-3 md:py-4">
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div>
                  <h3 className="text-xs md:text-sm font-medium mb-1">Status</h3>
                  <Badge className={`text-xs ${getStatusBadgeColor(selectedFiling.status)}`}>
                    {formatStatus(selectedFiling.status)}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-xs md:text-sm font-medium mb-1">Filed Date</h3>
                  <p className="text-xs md:text-sm">
                    {selectedFiling.filedDate ? formatDate(selectedFiling.filedDate) : "Not filed yet"}
                  </p>
                </div>

                <div>
                  <h3 className="text-xs md:text-sm font-medium mb-1">Due Date</h3>
                  <p className="text-xs md:text-sm">
                    {formatDate(
                      selectedFiling.dueDate || (selectedFiling.deadline ? selectedFiling.deadline.dueDate : null),
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {selectedFiling.receiptUrl && (
                  <div>
                    <h3 className="text-xs md:text-sm font-medium mb-1 md:mb-2">Your Payment Receipt</h3>
                    <div className="border rounded-md p-2 h-36 md:h-48 flex items-center justify-center">
                      <img
                        src={selectedFiling.receiptUrl || "/placeholder.svg"}
                        alt="Payment Receipt"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="mt-2 flex justify-end">
                      <Button variant="outline" size="sm" asChild className="text-xs md:text-sm h-7 md:h-8">
                        <a href={selectedFiling.receiptUrl} target="_blank" rel="noopener noreferrer" download>
                          <Download className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                          Download Receipt
                        </a>
                      </Button>
                    </div>
                  </div>
                )}

                {selectedFiling.reportUrl && (
                  <div>
                    <h3 className="text-xs md:text-sm font-medium mb-1 md:mb-2">Filed Report</h3>
                    <div className="border rounded-md p-2 h-36 md:h-48 flex items-center justify-center">
                      <FileText className="h-12 w-12 md:h-16 md:w-16 text-gray-300" />
                    </div>
                    <div className="mt-2 flex justify-end">
                      <Button variant="outline" size="sm" asChild className="text-xs md:text-sm h-7 md:h-8">
                        <a href={selectedFiling.reportUrl} target="_blank" rel="noopener noreferrer" download>
                          <Download className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                          Download Report
                        </a>
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {selectedFiling.userNotes && (
                  <div>
                    <h3 className="text-xs md:text-sm font-medium mb-1">Your Notes</h3>
                    <p className="text-xs md:text-sm p-2 md:p-3 bg-gray-50 rounded-md break-words">
                      {selectedFiling.userNotes}
                    </p>
                  </div>
                )}

                {selectedFiling.adminNotes && (
                  <div>
                    <h3 className="text-xs md:text-sm font-medium mb-1">Admin Notes</h3>
                    <p className="text-xs md:text-sm p-2 md:p-3 bg-gray-50 rounded-md break-words">
                      {selectedFiling.adminNotes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => setShowViewFilingDialog(false)} className="w-full sm:w-auto text-xs md:text-sm">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

