import type { ReactNode } from "react"
import { Inter } from "next/font/google"
import type { Metadata } from "next"
import ScrollToTopButton from "@/components/ScrollToTopButton" // Import here
import Navbar from "@/components/navbar"
import TopBar from "@/components/top-bar"
import Footer from "@/components/footer"
import { Toaster } from "@/components/ui/toaster"
import Preloader from "@/components/preloader"
import { CartProvider } from "@/context/cart-context"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Orizen Inc - Start your LLC",
  icons: "/faviconorizen.png",
  description: "Start your LLC with confidence",
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CartProvider>
          <Toaster />
          <TopBar /> {/* Topbar at the top */}
          <Preloader />
          <Navbar /> {/* Navbar below the Topbar */}
          <main>{children}</main> {/* Main content */}
          <Footer /> {/* Footer at the bottom */}
          <ScrollToTopButton /> {/* Scroll to top button */}
        </CartProvider>
      </body>
    </html>
  )
}

