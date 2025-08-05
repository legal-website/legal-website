"use client"
import { Mail, MapPin, Phone } from "lucide-react"
import Link from "next/link"

export default function TopBar() {
  return (
    <div className="bg-gradient-to-r from-[#22c984] to-[#0B0E19] text-white py-2 px-2 sm:px-6">
      <div className="container mx-auto px-2 sm:px-6">
        <div className="flex justify-between items-center">
          {/* Left Section - Address and Phone Number */}
          <div className="flex items-center space-x-2 sm:space-x-[30px]">
            {/* Address with Google Maps Link - Hidden on mobile */}
            <Link
              href="https://www.google.com/maps?q=7901,+N+STE+15322,+St.+Petersburg,+FL"
              target="_blank"
              className="hidden md:flex items-center text-[14px] font-medium group hover:text-black transition-colors"
            >
              <MapPin className="h-5 w-5 mr-1.5 text-white group-hover:text-black transition-colors" />
              <span>55W 14th Street, Helena, MT</span>
            </Link>
          {/* Right Section - Contact & Socials */}
          <div className="flex items-center space-x-2 sm:space-x-6">
            {/* Email */}
            <Link
              href="mailto:Info@orizeninc.com"
              className="flex items-center text-[12px] sm:text-[14px] font-medium hover:text-gray-300"
            >
              <Mail className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-1.5 text-[#22c984]" />
              Info@orizeninc.com
            </Link>

            {/* Social Icons - Hidden on mobile */}
            <div className="hidden sm:flex items-center space-x-3">
              <Link href="https://facebook.com" target="_blank">
                <svg className="h-4 w-5 fill-white hover:fill-[#22c984]" viewBox="0 0 24 24">
                  <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.378 14.192 5 15.115 5H18V0h-3.808C10.596 0 9 1.583 9 4.615V8z" />
                </svg>
              </Link>
              <Link href="https://instagram.com" target="_blank">
                <svg className="h-4 w-5 fill-white hover:fill-[#22c984]" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </Link>
              <Link href="https://linkedin.com" target="_blank">
                <svg className="h-4 w-5 fill-white hover:fill-[#22c984]" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </Link>
              <Link href="https://tumblr.com" target="_blank">
                <svg className="h-4 w-5 fill-white hover:fill-[#22c984]" viewBox="0 0 24 24">
                  <path d="M14.563 24c-5.093 0-7.031-3.756-7.031-6.411V9.747H5.116V6.648c3.063-1.115 4.735-3.897 4.917-6.168.05-.647.402-.48.402-.48h3.572v6.242h4.367v3.505h-4.397v7.461c0 1.582.699 2.144 2.061 2.144h.162c.594-.017 1.403-.174 1.825-.37l1.086 3.252c-.404.57-2.245 1.234-3.881 1.277-.027.002-.052.002-.078.002" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

