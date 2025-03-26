import type { ReactNode } from "react"
import CommunityHeader from "./components/community-header"
import DebugButton from "./components/debug-button"

export default function CommunityLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex justify-between items-center p-4 border-b">
        <CommunityHeader />
        <DebugButton />
      </div>
      <main className="flex-1">{children}</main>
    </div>
  )
}

