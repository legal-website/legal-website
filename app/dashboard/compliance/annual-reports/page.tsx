"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { AlertCircle, CalendarIcon, CheckCircle, Download, FileText } from "lucide-react"

export default function AnnualReportsPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())

  // Example upcoming deadlines
  const upcomingDeadlines = [
    { name: "Annual Report Filing", date: "July 15, 2024", daysLeft: 45, urgent: true },
    { name: "Tax Filing Deadline", date: "September 30, 2024", daysLeft: 122, urgent: false },
  ]

  // Example past filings
  const pastFilings = [
    { name: "Annual Report 2023", date: "July 10, 2023", status: "Filed" },
    { name: "Annual Report 2022", date: "July 12, 2022", status: "Filed" },
  ]

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
  weekStartsOn={0}  // Ensure the week starts on Sunday (0 = Sunday, 1 = Monday, etc.)
  modifiers={{
    booked: [new Date(2024, 6, 15)], // July 15, 2024
    today: new Date(),
  }}
  modifiersStyles={{
    booked: { border: "2px solid red", borderRadius: "50%" },
  }}
/>

          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Upcoming Deadlines</h3>
            <div className="space-y-4">
              {upcomingDeadlines.map((deadline) => (
                <div key={deadline.name} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {deadline.urgent ? (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      ) : (
                        <CalendarIcon className="h-5 w-5 text-[#22c984]" />
                      )}
                      <h4 className="font-medium">{deadline.name}</h4>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        deadline.urgent ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {deadline.daysLeft} days left
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Due: {deadline.date}</p>
                  <div className="mt-3 ">
                    <Button  size="sm">File Now</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div>
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Filing Requirements</h3>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Annual Report</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Your company is required to file an annual report with the Secretary of State by July 15 each year.
                </p>
                <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
                  <li>Filing fee: $75.00</li>
                  <li>Late fee: $25.00 per month</li>
                  <li>Required information: Company address, registered agent, officer information</li>
                </ul>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Tax Filings</h4>
                <p className="text-sm text-gray-600">
                  Annual tax filings are due by September 30. Consult with your accountant for specific requirements.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Past Filings</h3>
            <div className="space-y-4">
              {pastFilings.map((filing) => (
                <div key={filing.name} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium">{filing.name}</p>
                      <p className="text-xs text-gray-600">Filed on: {filing.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {filing.status}
                    </span>
                    <Button variant="ghost" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

