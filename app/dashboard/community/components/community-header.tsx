"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus } from "lucide-react"
import Link from "next/link"

interface CommunityHeaderProps {
  onSearch?: (query: string) => void
  searchQuery?: string
}

export default function CommunityHeader({ onSearch, searchQuery = "" }: CommunityHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
      <h1 className="text-2xl font-bold">Community</h1>
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search posts..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => onSearch && onSearch(e.target.value)}
          />
        </div>
        <Button asChild>
          <Link href="/dashboard/community/new">
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Link>
        </Button>
      </div>
    </div>
  )
}

