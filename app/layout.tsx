import type { ReactNode } from "react"
import { Inter } from "next/font/google"
import type { Metadata } from "next"
import ScrollToTopButton from "@/components/ScrollToTopButton"
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
import StructuredData from "@/components/structured-data"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "Orizen Inc - Business Formation & LLC Services",
    template: "%s | Orizen Inc",
  },
  description:
    "Orizen Inc provides fast, affordable LLC formation and business services. Start your business today with our expert guidance and comprehensive support.",
  verification: {
    google: "upbol3w1_uLSqHgRb23sK3psrkKjn2o5vPzGK3FkVYQ",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://orizeninc.com",
    siteName: "Orizen Inc",
    title: "Orizen Inc - Business Formation & LLC Services",
    description:
      "Orizen Inc provides fast, affordable LLC formation and business services. Start your business today with our expert guidance and comprehensive support.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Orizen Inc",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Orizen Inc - Business Formation & LLC Services",
    description:
      "Orizen Inc provides fast, affordable LLC formation and business services. Start your business today with our expert guidance and comprehensive support.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://orizeninc.com",
  },
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-16x16.png" sizes="16x16" type="image/png" />
        <link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />

        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-H5RQYL16TB"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
         window.dataLayer = window.dataLayer || [];
         function gtag(){dataLayer.push(arguments);}
         gtag('js', new Date());

         gtag('config', 'G-H5RQYL16TB');
       `,
          }}
        />

        {/* JSON-LD structured data for Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Orizen Inc",
              url: "https://orizeninc.com",
              logo: "https://orizeninc.com/icon-512.png",
              sameAs: [
                "https://www.facebook.com/orizeninc",
                "https://twitter.com/orizeninc",
                "https://www.linkedin.com/company/orizeninc",
              ],
              contactPoint: {
                "@type": "ContactPoint",
                telephone: "+92 329 9438557",
                contactType: "customer service",
              },
            }),
          }}
        />
        <StructuredData />
      </head>
      <body className={`${inter.className} overflow-x-hidden`}>
        <ThemeProvider>
          <SessionProvider>
            <AuthProvider>
              <PricingProvider>
                <CartProvider>
                  <AffiliateTracker />
                  <Toaster />
                  <TopBar />
                  <Preloader />
                  <Navbar />
                  <main className="w-full max-w-[100vw] overflow-x-hidden">{children}</main>
                  <Footer />
                  <ScrollToTopButton />
                </CartProvider>
              </PricingProvider>
            </AuthProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
