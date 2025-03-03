"use client"

import Image from "next/image"
import Link from "next/link"
import { ScrollAnimation } from "@/components/GlobalScrollAnimation"
import { sendEmail } from "@/app/actions/send-email"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default function ContactPage() {
  const [formStatus, setFormStatus] = useState<{ message: string; isError: boolean } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(formData: FormData) {
    setFormStatus(null)
    setIsSubmitting(true)

    try {
      const result = await sendEmail(formData)
      setFormStatus({ message: result.message, isError: !result.success })
    } catch (error) {
      setFormStatus({ message: "An unexpected error occurred. Please try again.", isError: true })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-100">
      {/* Hero Section */}
      <div className="relative h-[400px] overflow-hidden">
        <Image src="/contact.webp" alt="Contact Us" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-purple-900/80">
          <div
            className="absolute top-0 left-0 w-full h-full"
            style={{
              backgroundImage:
                "linear-gradient(135deg, #4F46E5 25%, transparent 25%), linear-gradient(225deg, #4F46E5 25%, transparent 25%)",
              backgroundSize: "100% 100%",
              opacity: 0.1,
            }}
          />
        </div>
        <div className="relative container mx-auto px-4 h-full flex flex-col justify-center">
          <ScrollAnimation direction="down">
            <div className="text-white space-y-4">
              <nav className="text-sm mb-4">
                <ol className="flex items-center space-x-2">
                  <li>
                    <Link href="/" className="hover:text-gray-300">
                      Home
                    </Link>
                  </li>
                  <li>/</li>
                  <li>Contact Us</li>
                </ol>
              </nav>
              <h1 className="text-5xl font-bold" style={{ fontFamily: "Montserrat" }}>
                Contact Us
              </h1>
            </div>
          </ScrollAnimation>
        </div>
      </div>

      {/* Form Section */}
      <ScrollAnimation direction="up">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <span className="text-blue-600 text-sm font-medium mb-2 block" style={{ fontFamily: "Nethead" }}>
                REQUEST A QUOTE
              </span>
              <h2 className="text-3xl font-semibold text-gray-900" style={{ fontFamily: "Montserrat" }}>
                How May We Help You!
              </h2>
            </div>

            <form action={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Input
                    type="text"
                    name="name"
                    placeholder="Name *"
                    required
                    className="w-full p-3 border rounded-md"
                    style={{ fontFamily: "Nethead" }}
                  />
                </div>
                <div>
                  <Input
                    type="email"
                    name="email"
                    placeholder="Email *"
                    required
                    className="w-full p-3 border rounded-md"
                    style={{ fontFamily: "Nethead" }}
                  />
                </div>
              </div>
              <div>
                <Input
                  type="text"
                  name="subject"
                  placeholder="Subject *"
                  required
                  className="w-full p-3 border rounded-md"
                  style={{ fontFamily: "Nethead" }}
                />
              </div>
              <div>
                <Textarea
                  name="message"
                  placeholder="Write A Message"
                  rows={6}
                  className="w-full p-3 border rounded-md"
                  style={{ fontFamily: "Nethead" }}
                  required
                />
              </div>
              <div className="text-center">
                <Button
                  type="submit"
                  className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  style={{ fontFamily: "Nethead" }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </div>
              {formStatus && (
                <p
                  className={`text-center ${formStatus.isError ? "text-red-600" : "text-green-600"}`}
                  style={{ fontFamily: "Nethead" }}
                >
                  {formStatus.message}
                </p>
              )}
            </form>
          </div>
        </div>
      </ScrollAnimation>

      {/* Map Section */}
      <ScrollAnimation direction="up">
        <div className="w-full h-[500px] relative">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d193595.25280949928!2d-74.11976404942244!3d40.697403441901946!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c24fa5d33f083b%3A0xc80b8f06e177fe62!2sNew%20York%2C%20NY%2C%20USA!5e0!3m2!1sen!2s!4v1708644774680!5m2!1sen!2s"
            width="100%"
            height="500"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0"
          />
        </div>
      </ScrollAnimation>
    </main>
  )
}

