"use client"

import { Badge } from "@/components/ui/badge"

interface Tag {
  id: string
  name: string
}

interface TagBadgeProps {
  tag: Tag
  onClick?: () => void
}

export default function TagBadge({ tag, onClick }: TagBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={`cursor-${onClick ? "pointer" : "default"} hover:bg-secondary/80`}
      onClick={onClick}
    >
      {tag.name}
    </Badge>
  )
}

