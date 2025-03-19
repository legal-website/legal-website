"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle, Plus, Users } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface Owner {
  id: string
  name: string
  ownership: string
  title: string
  dateAdded: string
}

export default function BeneficialOwnershipPage() {
  const [owners, setOwners] = useState<Owner[]>([
    {
      id: "1",
      name: "John Smith",
      ownership: "60%",
      title: "CEO",
      dateAdded: "Jan 15, 2023",
    },
    {
      id: "2",
      name: "Sarah Johnson",
      ownership: "40%",
      title: "CFO",
      dateAdded: "Jan 15, 2023",
    },
  ])

  const [newOwner, setNewOwner] = useState({
    name: "",
    ownership: "",
    title: "",
  })

  const handleAddOwner = (e: React.FormEvent) => {
    e.preventDefault()
    const id = Math.random().toString(36).substring(2, 9)
    const dateAdded = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })

    setOwners([
      ...owners,
      {
        id,
        name: newOwner.name,
        ownership: newOwner.ownership + "%",
        title: newOwner.title,
        dateAdded,
      },
    ])

    // Reset form
    setNewOwner({ name: "", ownership: "", title: "" })
  }

  return (
    <div className="p-8 mb-40">
      <h1 className="text-3xl font-bold mb-6">Beneficial Ownership</h1>

      <Card className="p-6 mb-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Users className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-1">Beneficial Ownership Information</h3>
            <p className="text-gray-600">Manage your company&apos;s beneficial owners as required by FinCEN regulations</p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800">Important Compliance Notice</h4>
              <p className="text-sm text-amber-700">
                The Corporate Transparency Act requires companies to report beneficial ownership information to FinCEN.
                Keep your information up to date to avoid penalties.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold">Current Beneficial Owners</h4>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Owner
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Beneficial Owner</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddOwner} className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="owner-name">Full Name</Label>
                  <Input
                    id="owner-name"
                    value={newOwner.name}
                    onChange={(e) => setNewOwner({ ...newOwner, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="owner-title">Title/Position</Label>
                  <Input
                    id="owner-title"
                    value={newOwner.title}
                    onChange={(e) => setNewOwner({ ...newOwner, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="owner-percentage">Ownership Percentage</Label>
                  <div className="relative">
                    <Input
                      id="owner-percentage"
                      type="number"
                      min="0"
                      max="100"
                      value={newOwner.ownership}
                      onChange={(e) => setNewOwner({ ...newOwner, ownership: e.target.value })}
                      className="pr-8"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2">%</span>
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  Add Owner
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b">
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Ownership</th>
                <th className="pb-3 font-medium">Title</th>
                <th className="pb-3 font-medium">Date Added</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {owners.map((owner) => (
                <tr key={owner.id}>
                  <td className="py-4">{owner.name}</td>
                  <td className="py-4">{owner.ownership}</td>
                  <td className="py-4">{owner.title}</td>
                  <td className="py-4">{owner.dateAdded}</td>
                  <td className="py-4">
                    <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Reported
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50">
                        Remove
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Filing History</h3>
        <div className="space-y-4">
          {[
            { name: "Initial BOI Report", date: "Jan 15, 2023", status: "Filed" },
            { name: "BOI Update", date: "Mar 10, 2024", status: "Filed" },
          ].map((filing) => (
            <div key={filing.name} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">{filing.name}</p>
                <p className="text-sm text-gray-600">Filed on: {filing.date}</p>
              </div>
              <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full flex items-center">
                <CheckCircle className="h-3 w-3 mr-1" />
                {filing.status}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

