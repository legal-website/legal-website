"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function AffiliateDebugPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState("")
  const [invoiceId, setInvoiceId] = useState("")
  const [affiliateCode, setAffiliateCode] = useState("")
  const [forceLoading, setForceLoading] = useState(false)
  const [forceResult, setForceResult] = useState<any>(null)

  useEffect(() => {
    fetchDebugData()
  }, [])

  const fetchDebugData = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/affiliate/debug")
      const result = await response.json()

      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error || "Failed to fetch debug data")
      }
    } catch (err) {
      setError("An error occurred while fetching debug data")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleForceConversion = async () => {
    if (!invoiceId || !affiliateCode) {
      setError("Invoice ID and Affiliate Code are required")
      return
    }

    setForceLoading(true)
    setForceResult(null)

    try {
      const response = await fetch("/api/affiliate/force-conversion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoiceId,
          affiliateCode,
        }),
      })

      const result = await response.json()
      setForceResult(result)

      if (result.success) {
        // Refresh debug data
        fetchDebugData()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setForceLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Affiliate System Debug</h1>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Force Conversion</CardTitle>
            <CardDescription>Manually create a conversion record</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="invoiceId">Invoice ID</Label>
                <Input
                  id="invoiceId"
                  value={invoiceId}
                  onChange={(e) => setInvoiceId(e.target.value)}
                  placeholder="Enter invoice ID"
                />
              </div>
              <div>
                <Label htmlFor="affiliateCode">Affiliate Code</Label>
                <Input
                  id="affiliateCode"
                  value={affiliateCode}
                  onChange={(e) => setAffiliateCode(e.target.value)}
                  placeholder="Enter affiliate code"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleForceConversion} disabled={forceLoading} className="w-full">
              {forceLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Force Conversion"
              )}
            </Button>
          </CardFooter>
        </Card>

        {forceResult && (
          <Card>
            <CardHeader>
              <CardTitle>Force Conversion Result</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
                {JSON.stringify(forceResult, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-4">Affiliate Cookies</h2>
          {data?.affiliateCookies?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 border">Key</th>
                    <th className="px-4 py-2 border">Value (Affiliate Code)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.affiliateCookies.map((cookie: any) => (
                    <tr key={cookie.id}>
                      <td className="px-4 py-2 border">{cookie.key}</td>
                      <td className="px-4 py-2 border">{cookie.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No affiliate cookies found</p>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Affiliate Links</h2>
          {data?.affiliateLinks?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 border">ID</th>
                    <th className="px-4 py-2 border">Code</th>
                    <th className="px-4 py-2 border">User</th>
                    <th className="px-4 py-2 border">Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {data.affiliateLinks.map((link: any) => (
                    <tr key={link.id}>
                      <td className="px-4 py-2 border">{link.id}</td>
                      <td className="px-4 py-2 border">{link.code}</td>
                      <td className="px-4 py-2 border">{link.user?.name || link.user?.email || "Unknown"}</td>
                      <td className="px-4 py-2 border">{new Date(link.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No affiliate links found</p>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Affiliate Conversions</h2>
          {data?.affiliateConversions?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 border">ID</th>
                    <th className="px-4 py-2 border">Order ID</th>
                    <th className="px-4 py-2 border">Affiliate</th>
                    <th className="px-4 py-2 border">Amount</th>
                    <th className="px-4 py-2 border">Commission</th>
                    <th className="px-4 py-2 border">Status</th>
                    <th className="px-4 py-2 border">Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {data.affiliateConversions.map((conversion: any) => (
                    <tr key={conversion.id}>
                      <td className="px-4 py-2 border">{conversion.id}</td>
                      <td className="px-4 py-2 border">{conversion.orderId}</td>
                      <td className="px-4 py-2 border">
                        {conversion.link?.user?.name || conversion.link?.user?.email || "Unknown"}
                      </td>
                      <td className="px-4 py-2 border">${Number(conversion.amount).toFixed(2)}</td>
                      <td className="px-4 py-2 border">${Number(conversion.commission).toFixed(2)}</td>
                      <td className="px-4 py-2 border">{conversion.status}</td>
                      <td className="px-4 py-2 border">{new Date(conversion.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No affiliate conversions found</p>
          )}
        </section>
      </div>

      <div className="mt-8">
        <Button onClick={fetchDebugData}>Refresh Data</Button>
      </div>
    </div>
  )
}

