import type { ReactNode } from "react"

interface PolicyContentProps {
  children: ReactNode
}

export default function PolicyContent({ children }: PolicyContentProps) {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
      <div className="prose prose-lg prose-green max-w-none">{children}</div>
    </div>
  )
}

