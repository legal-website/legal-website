"use client"
import Image from "next/image"
import type { Metadata } from "next"
import Link from "next/link"
import { ScrollAnimation } from "@/components/GlobalScrollAnimation"
import { sendEmail } from "@/app/actions/send-email"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Phone, Mail, MapPin } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
export const metadata: Metadata = {
  title: "Contact Orizen Inc - Get in Touch with Our Team",
  description:
    "Have questions or need support? Contact Orizen Inc for assistance with business formation, LLC services, and general inquiries. Our team is here to help you.",
  keywords: "contact Orizen Inc, business formation support, LLC help, customer service, get in touch Orizen, contact page",
}

export default function ContactPage() {
  const [formStatus, setFormStatus] = useState<{ message: string; isError: boolean } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(formData: FormData) {
    setFormStatus(null)
    setIsSubmitting(true)
    try {
      const result = await sendEmail(formData)
      setFormStatus({ message: result.message, isError: !result.success })
    } catch {
      setFormStatus({ message: "An unexpected error occurred. Please try again.", isError: true })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative h-[300px] sm:h-[400px] md:h-[500px] overflow-hidden">
        <Image src="/contact.webp" alt="Contact Us" fill className="object-cover object-center" priority />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-[#22c984]/80">
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
            <div className="text-white space-y-4 text-center">
              <nav className="text-sm mb-4">
                <ol className="flex items-center justify-center space-x-2">
                  <li>
                    <Link href="/" className="hover:text-gray-300">
                      Home
                    </Link>
                  </li>
                  <li>/</li>
                  <li>Contact Us</li>
                </ol>
              </nav>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-normal drop-shadow-lg font-[Montserrat]">
                Contact Us
              </h1>
            </div>
          </ScrollAnimation>
        </div>
      </div>

      {/* Contact Information Section */}
      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-10 sm:py-16 md:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 lg:gap-12">
          {[
            {
              icon: (
                <Phone className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-[#22c984] group-hover:text-black transition-colors" />
              ),
              title: "Give us a call",
              content: ["+923299438557"],
            },
            {
              icon: (
                <Mail className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-[#22c984] group-hover:text-black transition-colors" />
              ),
              title: "Drop us a line",
              content: ["Info@orizeninc.com", "orizeninc@gmail.com"],
            },
            {
              icon: (
                <MapPin className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-[#22c984] group-hover:text-black transition-colors" />
              ),
              title: "Visit our office",
              content: ["7901, N STE 15322, St. Petersburg, FL."],
            },
          ].map((item, index) => (
            <ScrollAnimation key={index} direction={index === 0 ? "left" : index === 1 ? "up" : "right"}>
              <div className="bg-white shadow-lg p-4 sm:p-6 md:p-8 rounded-lg text-center hover:shadow-2xl transition-shadow border border-transparent hover:border-[#22c984] relative group before:absolute before:inset-0 before:border before:border-[#22c984]/50 before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100">
                <div className="flex justify-center mb-4 sm:mb-6">
                  <div className="bg-blue-100 p-3 sm:p-4 rounded-full">{item.icon}</div>
                </div>
                <h2 className="text-xl sm:text-2xl font-normal mb-3 sm:mb-4 group-hover:text-[#22c984] transition-colors font-[Montserrat]">
                  {item.title}
                </h2>
                <div className="space-y-1 sm:space-y-2 text-gray-600 text-sm sm:text-base font-[Nethead] font-[400]">
                  {item.content.map((text, idx) => (
                    <p key={idx}>{text}</p>
                  ))}
                </div>
              </div>
            </ScrollAnimation>
          ))}
        </div>
      </div>

      {/* Form Section */}
      <ScrollAnimation direction="up">
        <div className="container mx-auto px-4 pb-10 sm:pb-16">
          <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-4 sm:p-6 md:p-8 transition-shadow duration-300 hover:shadow-xl">
            <div className="text-center mb-6 sm:mb-8">
              <span
                className="text-[#22c984] text-xs sm:text-sm font-medium mb-1 sm:mb-2 block"
                style={{ fontFamily: "Nethead" }}
              >
                REQUEST A QUOTE
              </span>
              <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900" style={{ fontFamily: "Montserrat" }}>
                How May We Help You!
              </h2>
            </div>
            <form action={handleSubmit} className="space-y-4 sm:space-y-6">
              <Input type="text" name="name" placeholder="Name *" required className="transition-colors duration-300" />
              <Input
                type="email"
                name="email"
                placeholder="Email *"
                required
                className="transition-colors duration-300"
              />
              <Input
                type="text"
                name="subject"
                placeholder="Subject *"
                required
                className="transition-colors duration-300"
              />
              <Textarea
                name="message"
                placeholder="Write A Message"
                rows={4}
                required
                className="transition-colors duration-300"
              />
              <div className="flex justify-center">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#22c984] hover:bg-[#1e9e6f] text-white w-full sm:w-auto py-2 px-4 rounded transition-colors duration-300"
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </div>
              {formStatus && (
                <p
                  className={`text-center text-sm sm:text-base ${formStatus.isError ? "text-red-600" : "text-green-600"}`}
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
        <div className="w-full h-[300px] sm:h-[400px] md:h-[500px] relative">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d193595.25280949928!2d-74.11976404942244!3d40.697403441901946!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c24fa5d33f083b%3A0xc80b8f06e177fe62!2sNew%20York%2C%20NY%2C%20USA!5e0!3m2!1sen!2s!4v1708644774680!5m2!1sen!2s"
            width="100%"
            height="100%"
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

