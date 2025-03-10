"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertCircle, CheckCircle, Download, FileText, Search, ShoppingBag } from "lucide-react"

interface Order {
  id: string
  orderNumber: string
  date: string
  amount: string
  status: "Completed" | "Processing" | "Refunded"
  items: string[]
}

export default function OrderHistoryPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("All")

  const orders: Order[] = [
    {
      id: "1",
      orderNumber: "ORD-2023-001",
      date: "Jan 15, 2023",
      amount: "$349.00",
      status: "Completed",
      items: ["LLC Formation Package", "EIN Filing", "Operating Agreement"],
    },
    {
      id: "2",
      orderNumber: "ORD-2023-045",
      date: "Mar 22, 2023",
      amount: "$99.00",
      status: "Completed",
      items: ["Annual Report Filing"],
    },
    {
      id: "3",
      orderNumber: "ORD-2023-078",
      date: "Jun 10, 2023",
      amount: "$49.00",
      status: "Completed",
      items: ["Business License Renewal"],
    },
    {
      id: "4",
      orderNumber: "ORD-2023-112",
      date: "Sep 05, 2023",
      amount: "$199.00",
      status: "Completed",
      items: ["Registered Agent Service (1 Year)"],
    },
    {
      id: "5",
      orderNumber: "ORD-2024-023",
      date: "Feb 18, 2024",
      amount: "$79.00",
      status: "Processing",
      items: ["Amendment Filing"],
    },
  ]

  const statuses = ["All", "Completed", "Processing", "Refunded"]

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some((item) => item.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = selectedStatus === "All" || order.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800"
      case "Processing":
        return "bg-blue-100 text-blue-800"
      case "Refunded":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="h-3.5 w-3.5 mr-1" />
      case "Processing":
        return <AlertCircle className="h-3.5 w-3.5 mr-1" />
      case "Refunded":
        return <AlertCircle className="h-3.5 w-3.5 mr-1" />
      default:
        return null
    }
  }

  return (
    <div className="p-8 mb-40">
      <h1 className="text-3xl font-bold mb-6">Order History</h1>

      <Card className="mb-8">
        <div className="p-6 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-xl font-semibold">Your Orders</h2>
            <Button>
              <ShoppingBag className="h-4 w-4 mr-2" />
              View Available Services
            </Button>
          </div>
        </div>

        <div className="p-6 border-b">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search orders..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-6">
          {filteredOrders.length > 0 ? (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <Dialog key={order.id}>
                  <DialogTrigger asChild>
                    <div className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <ShoppingBag className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{order.orderNumber}</p>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span>{order.date}</span>
                            <span>•</span>
                            <span>{order.amount}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs px-2 py-1 rounded-full flex items-center ${getStatusColor(order.status)}`}
                        >
                          {getStatusIcon(order.status)}
                          {order.status}
                        </span>
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Order Details</DialogTitle>
                    </DialogHeader>
                    <div className="mt-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-500">Order Number</p>
                          <p className="font-medium">{order.orderNumber}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Date</p>
                          <p className="font-medium">{order.date}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Status</p>
                          <span
                            className={`text-xs px-2 py-1 rounded-full flex items-center ${getStatusColor(order.status)}`}
                          >
                            {getStatusIcon(order.status)}
                            {order.status}
                          </span>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-2">Order Items</h4>
                        <ul className="space-y-2">
                          {order.items.map((item, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-2">Payment Information</h4>
                        <div className="flex justify-between">
                          <span>Total</span>
                          <span className="font-bold">{order.amount}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>Payment Method</span>
                          <span>Credit Card (ending in 4242)</span>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Download Invoice
                        </Button>
                        <Button>Contact Support</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900">No orders found</h3>
              <p className="text-gray-500 mt-1">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Need Additional Services?</h2>
        </div>
        <div className="p-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-4 border rounded-lg">
              <div className="p-2 bg-green-100 rounded-lg inline-block mb-3">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Annual Report Filing</h3>
              <p className="text-sm text-gray-600 mb-4">Let us handle your annual report filing requirements</p>
              <Button size="sm" variant="outline" className="w-full">
                Learn More
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="p-2 bg-blue-100 rounded-lg inline-block mb-3">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Registered Agent</h3>
              <p className="text-sm text-gray-600 mb-4">Professional registered agent service for your business</p>
              <Button size="sm" variant="outline" className="w-full">
                Learn More
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="p-2 bg-purple-100 rounded-lg inline-block mb-3">
                <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Business Licenses</h3>
              <p className="text-sm text-gray-600 mb-4">Get the licenses and permits your business needs</p>
              <Button size="sm" variant="outline" className="w-full">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

