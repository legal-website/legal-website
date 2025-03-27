"use client"

import { Button } from "@/components/ui/button"
import {
  updateSidebarCounter,
  incrementSidebarCounter,
  resetSidebarCounter,
  setNewBadge,
  removeBadge,
  getAllCounters,
  clearAllCounters,
} from "@/lib/admin-counter"
import { useState } from "react"

export function CounterDemo() {
  const [counterKey, setCounterKey] = useState("userManagement")
  const [counterValue, setCounterValue] = useState<string | number>("1")
  const [allCounters, setAllCounters] = useState<Record<string, any>>({})

  const handleShowAllCounters = () => {
    setAllCounters(getAllCounters())
  }

  return (
    <div className="p-4 border rounded-lg space-y-4">
      <h2 className="text-lg font-bold">Admin Sidebar Counter Demo</h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Counter Key</label>
          <select
            className="w-full p-2 border rounded-md"
            value={counterKey}
            onChange={(e) => setCounterKey(e.target.value)}
          >
            <option value="userManagement">User Management</option>
            <option value="pendingApprovals">Pending Approvals</option>
            <option value="documents">Documents</option>
            <option value="templates">Templates</option>
            <option value="promotions">Promotions</option>
            <option value="coupons">Coupons</option>
            <option value="campaigns">Campaigns</option>
            <option value="community">Community</option>
            <option value="moderation">Moderation</option>
            <option value="tickets">Support Tickets</option>
            <option value="amendments">Amendments</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Counter Value</label>
          <input
            type="text"
            className="w-full p-2 border rounded-md"
            value={counterValue}
            onChange={(e) => setCounterValue(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() =>
            updateSidebarCounter(counterKey, isNaN(Number(counterValue)) ? counterValue : Number(counterValue))
          }
        >
          Update Counter
        </Button>

        <Button variant="outline" onClick={() => incrementSidebarCounter(counterKey)}>
          Increment Counter
        </Button>

        <Button variant="outline" onClick={() => resetSidebarCounter(counterKey)}>
          Reset Counter
        </Button>

        <Button variant="outline" onClick={() => setNewBadge(counterKey)}>
          Set "New" Badge
        </Button>

        <Button variant="outline" onClick={() => removeBadge(counterKey)}>
          Remove Badge
        </Button>
      </div>

      <div className="border-t pt-4">
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleShowAllCounters}>
            Show All Counters
          </Button>

          <Button
            variant="destructive"
            onClick={() => {
              clearAllCounters()
              setAllCounters({})
            }}
          >
            Clear All Counters
          </Button>
        </div>

        {Object.keys(allCounters).length > 0 && (
          <div className="mt-4 p-4 bg-gray-100 rounded-md">
            <h3 className="font-medium mb-2">Current Counters:</h3>
            <pre className="text-xs overflow-auto">{JSON.stringify(allCounters, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
}

