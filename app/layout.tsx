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
import { ThemeProvider } from "@/context/theme-context"
import { AuthProvider } from "@/context/auth-context"
import { SessionProvider } from "@/components/session-provider"
import { PricingProvider } from "@/context/pricing-context"
import { AffiliateTracker } from "@/components/affiliate-tracker"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Orizen Inc - Start your LLC",
  description: "Start your LLC with confidence",
  icons: {
    icon: '/faviconorizen.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} overflow-x-hidden`}>
        <ThemeProvider>
          <SessionProvider>
            <AuthProvider>
              <PricingProvider>
                <CartProvider>
                  <AffiliateTracker />
                  <Toaster />
                  <TopBar /> {/* Topbar at the top */}
                  <Preloader />
                  <Navbar /> {/* Navbar below the Topbar */}
                  <main className="w-full max-w-[100vw] overflow-x-hidden">{children}</main> {/* Main content */}
                  <Footer /> {/* Footer at the bottom */}
                  <ScrollToTopButton /> {/* Scroll to top button */}
                </CartProvider>
              </PricingProvider>
            </AuthProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

