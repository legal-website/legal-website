"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, DollarSign, Link, Share2, Users, UserPlus, ChevronDown, ChevronUp, MessageSquare } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export default function AffiliateProgramPage() {
  const [copied, setCopied] = useState(false)
  const [showFAQItem, setShowFAQItem] = useState<number | null>(null)

  const referralLink = "https://orizen.com/ref/user123"

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const toggleFAQItem = (index: number) => {
    setShowFAQItem(showFAQItem === index ? null : index)
  }

  const faqItems = [
    {
      question: "How does the affiliate program work?",
      answer:
        "Our affiliate program allows you to earn commissions by referring new customers to our services. You&apos;ll receive a unique referral link to share, and when someone signs up using your link, you&apos;ll earn a commission on their purchases.",
    },
    {
      question: "How much can I earn?",
      answer:
        "You can earn 20% commission on all purchases made by users you refer. There&apos;s no limit to how much you can earn, and commissions are paid out monthly.",
    },
    {
      question: "When do I get paid?",
      answer:
        "Commissions are calculated at the end of each month and paid out by the 15th of the following month. You need a minimum balance of $50 to receive a payout.",
    },
    {
      question: "How long do referral cookies last?",
      answer:
        "Our referral cookies last for 30 days. This means if someone clicks your link but doesn&apos;t sign up immediately, you&apos;ll still get credit if they return and sign up within 30 days.",
    },
  ]

  return (
    <div className="p-8 mb-40">
      <h1 className="text-3xl font-bold mb-6">Affiliate Program</h1>

      <div className="grid md:grid-cols-3 gap-8 mb-8">
        {/* Earnings Card */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Total Earnings</h3>
            </div>
          </div>
          <p className="text-3xl font-bold mb-2">$420.00</p>
          <p className="text-sm text-gray-500">+$120.00 this month</p>
        </Card>

        {/* Referrals Card */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Total Referrals</h3>
            </div>
          </div>
          <p className="text-3xl font-bold mb-2">21</p>
          <p className="text-sm text-gray-500">6 active in the last 30 days</p>
        </Card>

        {/* Conversion Rate Card */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <UserPlus className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Conversion Rate</h3>
            </div>
          </div>
          <p className="text-3xl font-bold mb-2">12.5%</p>
          <p className="text-sm text-gray-500">168 link clicks</p>
        </Card>
      </div>

      {/* Referral Link Section */}
      <Card className="mb-8">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Your Referral Link</h2>
        </div>
        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Share this unique link with your network. When someone signs up using your link, you&apos;ll earn 20%
              commission on their purchases.
            </p>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Link className="h-4 w-4 text-gray-400" />
                </div>
                <Input value={referralLink} className="pl-9 pr-24" readOnly />
                <Button className="absolute right-1 top-1/2 -translate-y-1/2 h-8" size="sm" onClick={copyToClipboard}>
                  {copied ? "Copied!" : "Copy"}
                  <Copy className="ml-2 h-3.5 w-3.5" />
                </Button>
              </div>
              <Button variant="outline">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <Button variant="outline" className="flex items-center justify-center gap-2">
              <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </Button>
            <Button variant="outline" className="flex items-center justify-center gap-2">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
              </svg>
              Twitter
            </Button>
            <Button variant="outline" className="flex items-center justify-center gap-2">
              <svg className="h-5 w-5 text-blue-700" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              LinkedIn
            </Button>
          </div>
        </div>
      </Card>

      {/* Performance Tabs */}
      <Card className="mb-8">
        <Tabs defaultValue="earnings">
          <div className="p-6 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl font-semibold">Performance</h2>
              <TabsList>
                <TabsTrigger value="earnings">Earnings</TabsTrigger>
                <TabsTrigger value="referrals">Referrals</TabsTrigger>
                <TabsTrigger value="clicks">Clicks</TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="earnings" className="p-6">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">Monthly Earnings</h3>
                <select className="text-sm border rounded-md px-2 py-1">
                  <option>Last 6 months</option>
                  <option>Last year</option>
                  <option>All time</option>
                </select>
              </div>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                {/* This would be a chart in a real implementation */}
                <p className="text-gray-500">Earnings chart would appear here</p>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-4">Recent Earnings</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="pb-3 font-medium">Date</th>
                      <th className="pb-3 font-medium">Referral</th>
                      <th className="pb-3 font-medium">Purchase</th>
                      <th className="pb-3 font-medium">Commission</th>
                      <th className="pb-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="py-3">Jun 12, 2024</td>
                      <td className="py-3">john.doe@example.com</td>
                      <td className="py-3">LLC Formation Package</td>
                      <td className="py-3 font-medium">$39.80</td>
                      <td className="py-3">
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">Paid</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3">Jun 08, 2024</td>
                      <td className="py-3">sarah.smith@example.com</td>
                      <td className="py-3">Premium Package</td>
                      <td className="py-3 font-medium">$49.80</td>
                      <td className="py-3">
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">Paid</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3">May 29, 2024</td>
                      <td className="py-3">mike.johnson@example.com</td>
                      <td className="py-3">Standard Package</td>
                      <td className="py-3 font-medium">$39.80</td>
                      <td className="py-3">
                        <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">Pending</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="referrals" className="p-6">
            <div className="mb-6">
              <h3 className="font-medium mb-4">Your Referrals</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="pb-3 font-medium">Name/Email</th>
                      <th className="pb-3 font-medium">Date Joined</th>
                      <th className="pb-3 font-medium">Total Spent</th>
                      <th className="pb-3 font-medium">Your Commission</th>
                      <th className="pb-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="py-3">
                        <div>
                          <p className="font-medium">John Doe</p>
                          <p className="text-sm text-gray-500">john.doe@example.com</p>
                        </div>
                      </td>
                      <td className="py-3">Jun 12, 2024</td>
                      <td className="py-3">$199.00</td>
                      <td className="py-3 font-medium">$39.80</td>
                      <td className="py-3">
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">Active</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3">
                        <div>
                          <p className="font-medium">Sarah Smith</p>
                          <p className="text-sm text-gray-500">sarah.smith@example.com</p>
                        </div>
                      </td>
                      <td className="py-3">Jun 08, 2024</td>
                      <td className="py-3">$249.00</td>
                      <td className="py-3 font-medium">$49.80</td>
                      <td className="py-3">
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">Active</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3">
                        <div>
                          <p className="font-medium">Mike Johnson</p>
                          <p className="text-sm text-gray-500">mike.johnson@example.com</p>
                        </div>
                      </td>
                      <td className="py-3">May 29, 2024</td>
                      <td className="py-3">$199.00</td>
                      <td className="py-3 font-medium">$39.80</td>
                      <td className="py-3">
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">Active</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="clicks" className="p-6">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">Link Clicks</h3>
                <select className="text-sm border rounded-md px-2 py-1">
                  <option>Last 30 days</option>
                  <option>Last 90 days</option>
                  <option>All time</option>
                </select>
              </div>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                {/* This would be a chart in a real implementation */}
                <p className="text-gray-500">Clicks chart would appear here</p>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-4">Click Statistics</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Total Clicks</p>
                  <p className="text-2xl font-bold">168</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Conversion Rate</p>
                  <p className="text-2xl font-bold">12.5%</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Avg. Commission</p>
                  <p className="text-2xl font-bold">$42.80</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Payout Information */}
      <Card className="mb-8">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Payout Information</h2>
        </div>
        <div className="p-6">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-medium">Current Balance</h3>
                <p className="text-2xl font-bold">$120.00</p>
              </div>
              <Button>Request Payout</Button>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm font-medium">Progress to next payout</p>
                <p className="text-xs text-gray-500">($50 minimum)</p>
              </div>
              <div className="mb-2">
                <Progress value={100} className="h-2" />
              </div>
              <p className="text-xs text-gray-500">You&apos;ve reached the minimum payout threshold</p>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-4">Payout History</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b">
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Method</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="py-3">May 15, 2024</td>
                    <td className="py-3 font-medium">$300.00</td>
                    <td className="py-3">PayPal</td>
                    <td className="py-3">
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">Completed</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3">Apr 15, 2024</td>
                    <td className="py-3 font-medium">$250.00</td>
                    <td className="py-3">Bank Transfer</td>
                    <td className="py-3">
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">Completed</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3">Mar 15, 2024</td>
                    <td className="py-3 font-medium">$180.00</td>
                    <td className="py-3">PayPal</td>
                    <td className="py-3">
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">Completed</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Card>

      {/* FAQ Section */}
      <Card>
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Frequently Asked Questions</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <div key={index} className="border rounded-lg overflow-hidden">
                <button
                  className="flex items-center justify-between w-full p-4 text-left font-medium"
                  onClick={() => toggleFAQItem(index)}
                >
                  {item.question}
                  {showFAQItem === index ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </button>
                {showFAQItem === index && (
                  <div className="p-4 bg-gray-50 border-t">
                    <p className="text-gray-600">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-600 mb-4">Have more questions about our affiliate program?</p>
            <Button>
              <MessageSquare className="mr-2 h-4 w-4" />
              Contact Support
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

