"use client"
import type React from "react"
import { useState, useTransition } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import ScrollToTopButton from "@/components/ScrollToTopButton"
import { Send, Phone, Mail, Facebook, Twitter, Instagram, Linkedin } from "lucide-react"
import { ScrollAnimation } from "./GlobalScrollAnimation"
import { useToast } from "@/components/ui/use-toast"
import { subscribeToNewsletter } from "@/app/actions/newsletter"

function isValidEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export default function Footer() {
  const [email, setEmail] = useState("")
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const handleSubscribe = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!email || !isValidEmail(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.append("email", email)
      const result = await subscribeToNewsletter(formData)

      if (result.success) {
        setEmail("")
        toast({
          title: "Subscription successful!",
          description: result.message,
          variant: "default",
        })
      } else {
        toast({
          title: "Subscription failed",
          description: result.message,
          variant: "destructive",
        })
      }
    })
  }

  return (
    <ScrollAnimation>
      <footer className="bg-[#1a1a1a] text-white relative">
        {/* Newsletter Section */}
        <div className="container mx-auto px-6 md:px-12 lg:px-20 pt-[85px] pb-[0px] flex justify-center relative z-[9999]">
          <div
            className="max-w-[900px] w-full bg-gradient-to-r from-[#22c984] to-[#1eac73] rounded-xl pt-12 pb-0 px-8 relative z-[9999]"
            style={{
              marginTop: "-170px",
              position: "relative",
            }}
          >
            <form
              onSubmit={handleSubscribe}
              className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 pb-8 md:pb-12"
            >
              <div className="w-full md:w-auto text-center md:text-left">
                <h3 className="text-sm font-semibold uppercase mb-2">Newsletter</h3>
                <h4 className="text-xl md:text-2xl font-semibold text-black">Subscribe to our newsletter</h4>
              </div>
              <div className="flex flex-col sm:flex-row w-full md:w-auto gap-4 sm:gap-2">
                <input
                  type="email"
                  name="email"
                  placeholder="your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex h-10 w-full md:w-[200px] lg:w-[280px] bg-transparent px-4 text-sm text-white placeholder:text-gray-300 focus:outline-none border-b border-white"
                />
                <Button
                  type="submit"
                  disabled={isPending}
                  className="px-6 sm:px-10 py-2 bg-black text-white flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(0,0,0,0.4)] hover:bg-[#22c984] hover:text-black hover:shadow-[0_6px_20px_rgba(0,0,0,0.5)] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isPending ? (
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {isPending ? "Sending..." : "Send"}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Rest of the footer content remains unchanged */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 container mx-auto px-4 md:px-6 lg:px-12 mt-12 md:mt-16 pb-10">
          {/* Contact Section */}
          <div>
            <h3 className="font-semibold text-lg mb-6">Contact Us Directly</h3>
            <div className="space-y-4">
              <Link
                href="tel:(123) 456-7896"
                className="flex items-center gap-2 text-gray-300 hover:text-[#22c984] transition-colors"
              >
                <Phone className="h-4 w-4 flex-shrink-0" /> <span className="break-all">(123) 456-7896</span>
              </Link>
              <Link
                href="mailto:info@orizen.com"
                className="flex items-center gap-2 text-gray-300 hover:text-[#22c984] transition-colors"
              >
                <Mail className="h-4 w-4 flex-shrink-0" /> <span className="break-all">info@orizen.com</span>
              </Link>
            </div>

            <div className="mt-8 bg-[#262626] p-6 md:p-10 rounded-lg shadow-lg">
              <Button className="w-full bg-[#22c984] hover:bg-[#8ef9cc] hover:text-black py-3 transition-all duration-300 shadow-md hover:shadow-lg">
                START A PROJECT
              </Button>
              <Button
                variant="outline"
                className="w-full py-3 mt-4 text-black border-white hover:bg-[#22c984] hover:border-[#22c984] transition-all duration-300 shadow-md hover:shadow-lg"
              >
                SEE OUR WORK
              </Button>
            </div>
          </div>

          {/* Our Links */}
          <div className="ml-0 sm:ml-[30px] md:ml-[65px]">
            <h3 className="font-semibold text-lg mb-6">Our Links</h3>
            <div className="space-y-3">
              {[
                { name: "Home", href: "/" },
                { name: "About Us", href: "/about" },
                { name: "Contact", href: "/contact" },
              ].map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block text-gray-300 hover:text-[#22c984] transition-colors"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Exhibitor Tools */}
          <div className="ml-0 sm:ml-[15px] md:ml-[35px]">
            <h3 className="font-semibold text-lg mb-6">Orizen Inc Tools</h3>
            <div className="space-y-3">
              {["Orizen Login", "Track Your Package", "Insights", "Careers"].map((item) => (
                <Link key={item} href="#" className="block text-gray-300 hover:text-[#22c984] transition-colors">
                  {item}
                </Link>
              ))}
            </div>
          </div>

          {/* Logo Section */}
          <div className="flex flex-col items-center">
            <div className="border-[10px] md:border-[14px] border-[#22c984] rounded-lg flex items-center justify-center overflow-hidden w-40 h-40 md:w-52 md:h-52 shadow-[0_4px_10px_rgba(0,0,0,0.15)]">
              <Image
                src="/footerorizen.webp"
                alt="Footer Logo"
                width={200}
                height={200}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Scroll-to-Top Button */}
            <ScrollToTopButton />
          </div>
        </div>

        {/* First Bottom Bar */}
        <div className="border-t border-gray-800">
          <div className="container mx-auto px-4 md:px-6 lg:px-12 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              {/* Navigation Links */}
              <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-400">
                <Link href="/privacy-policy" className="hover:text-[#22c984]" target="_blank" rel="noopener noreferrer">
                  Privacy Policy
                </Link>
                <Link
                  href="/terms-and-conditions"
                  className="hover:text-[#22c984]"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Terms & Conditions
                </Link>
              </div>

              {/* Social Media Section */}
              <div className="flex items-center gap-4">
                <span className="text-gray-400 text-sm">Follow us</span>
                <div className="flex gap-4">
                  {[
                    { icon: Linkedin, href: "https://linkedin.com" },
                    { icon: Instagram, href: "https://instagram.com" },
                    { icon: Facebook, href: "https://facebook.com" },
                    { icon: Twitter, href: "https://twitter.com" },
                  ].map((social, i) => (
                    <Link
                      key={i}
                      href={social.href}
                      className="text-gray-400 hover:text-[#22c984] transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <social.icon className="h-5 w-5" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* New Bottom Bar */}
        <div className="border-t border-gray-800 py-4">
          <div className="container mx-auto px-4 md:px-6 lg:px-12 text-center text-gray-400 text-sm flex flex-col md:flex-row justify-between items-center gap-2">
            <span>© 2024 Orizen Exposition. All rights reserved</span>
            <span>
              Web Design by
              <Link
                href="https://beta-tech.solutions"
                className="hover:text-[#22c984] transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                {" "}
                Beta-Tech.Solutions
              </Link>
            </span>
          </div>
        </div>
      </footer>
    </ScrollAnimation>
  )
}

