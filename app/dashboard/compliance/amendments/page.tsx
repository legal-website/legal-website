"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { FileText, PenTool } from "lucide-react"

export default function AmendmentsPage() {
  const [amendmentText, setAmendmentText] = useState("")

  const handleAmendmentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle amendment submission
    console.log("Amendment submitted:", amendmentText)
    // Reset form or show success message
    setAmendmentText("")
  }

  return (
    <div className="p-8 mb-44">
      <h1 className="text-3xl font-bold mb-6">Amendments</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <PenTool className="h-6 w-6 text-[#22c984]" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-1">Submit Amendment</h3>
              <p className="text-gray-600">Update your company information</p>
            </div>
          </div>

          <form onSubmit={handleAmendmentSubmit} className="space-y-4">
            <div>
              <Label htmlFor="amendment-type">Amendment Type</Label>
              <select
                id="amendment-type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Select amendment type</option>
                <option value="name">Company Name Change</option>
                <option value="address">Address Change</option>
                <option value="ownership">Ownership Change</option>
                <option value="business">Business Purpose Change</option>
                <option value="other">Other Amendment</option>
              </select>
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
            <div>
              <Label htmlFor="amendment-file">Supporting Documents (Optional)</Label>
              <Input id="amendment-file" type="file" />
            </div>
            <Button type="submit" className="w-full bg-[#22c984] hover:bg-[#1a8055]">
              Submit Amendment
            </Button>
          </form>
        </Card>

        <div>
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Amendment Credits</h3>
            <div className="flex items-center justify-between mb-4">
              <span>Available credits:</span>
              <span className="font-bold">2</span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Each credit allows you to file one amendment. Additional amendments can be purchased.
            </p>
            <Button variant="outline" className="w-full bg-[#22c984] hover:bg-[#1a8055]">
              Purchase Credits
            </Button>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Amendments</h3>
            <div className="space-y-4">
              {[
                { name: "Address Change", date: "Mar 15, 2024", status: "Approved" },
                { name: "Business Purpose Update", date: "Jan 10, 2024", status: "Approved" },
              ].map((amendment) => (
                <div key={amendment.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium">{amendment.name}</p>
                      <p className="text-xs text-gray-600">{amendment.date}</p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">{amendment.status}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}