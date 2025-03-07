"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { AlertCircle, CalendarIcon, CheckCircle, FileText, Info, PenTool, Users } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export default function CompliancePage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [amendmentText, setAmendmentText] = useState("")
  const complianceScore = 65 // Example score

  const handleAmendmentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle amendment submission
    console.log("Amendment submitted:", amendmentText)
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Compliance Dashboard</h1>

      {/* Compliance Score */}
      <Card className="p-6 mb-8">
        <div className="flex items-center gap-6">
          <div className="relative w-24 h-24">
            <Progress value={complianceScore} className="h-24 w-24" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold">{complianceScore}%</span>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Compliance Score</h3>
            <p className="text-gray-600">Your business is maintaining good compliance standards.</p>
          </div>
        </div>
      </Card>

      {/* Quick Actions Grid */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* Amendments */}
        <Dialog>
          <DialogTrigger asChild>
            <Card className="p-6 cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <PenTool className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Amendments</h3>
                  <p className="text-sm text-gray-600">Submit company amendments</p>
                </div>
              </div>
            </Card>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit Amendment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAmendmentSubmit} className="space-y-4">
              <div>
                <Label htmlFor="amendment-type">Amendment Type</Label>
                <Input id="amendment-type" placeholder="Select amendment type" />
              </div>
              <div>
                <Label htmlFor="amendment-text">Amendment Details</Label>
                <Textarea
                  id="amendment-text"
                  placeholder="Describe your amendment..."
                  value={amendmentText}
                  onChange={(e) => setAmendmentText(e.target.value)}
                  rows={5}
                />
              </div>
              <Button type="submit" className="w-full">
                Submit Amendment
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Annual Reports */}
        <Dialog>
          <DialogTrigger asChild>
            <Card className="p-6 cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CalendarIcon className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Annual Reports</h3>
                  <p className="text-sm text-gray-600">View and file annual reports</p>
                </div>
              </div>
            </Card>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Annual Reports Calendar</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" />
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Upcoming Deadlines</h4>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    Annual Report Due: July 15, 2024
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Info className="h-4 w-4 text-blue-500" />
                    Tax Filing Deadline: September 30, 2024
                  </li>
                </ul>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Beneficial Ownership */}
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Beneficial Ownership</h3>
              <p className="text-sm text-gray-600">Manage ownership information</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Compliance Status */}
      <Card className="mb-8">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Compliance Status</h2>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Annual Report</span>
              </div>
              <span className="text-sm text-gray-600">Filed on Mar 15, 2024</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Business License</span>
              </div>
              <span className="text-sm text-gray-600">Valid until Dec 31, 2024</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                <span>Tax Filings</span>
              </div>
              <span className="text-sm text-yellow-600">Due in 45 days</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Recent Documents */}
      <Card>
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Recent Documents</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[
              { name: "Annual Report 2024", date: "Mar 15, 2024", type: "PDF" },
              { name: "Amendment Filing", date: "Feb 28, 2024", type: "PDF" },
              { name: "Meeting Minutes", date: "Jan 15, 2024", type: "DOC" },
            ].map((doc) => (
              <div key={doc.name} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-sm text-gray-600">{doc.date}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Download
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}

