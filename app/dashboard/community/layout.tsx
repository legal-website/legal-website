import type { ReactNode } from "react"

export default function CommunityLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen max-w-full overflow-hidden">
      <main className="flex-1 w-full">{children}</main>
    </div>
  )
}

