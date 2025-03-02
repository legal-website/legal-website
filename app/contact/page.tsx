"use client"

import Image from "next/image"
import Link from "next/link"
import { Phone, Mail, MapPin } from "lucide-react"
import { ScrollAnimation } from "@/components/GlobalScrollAnimation"

export default function ContactPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <div className="relative h-[450px] overflow-hidden">
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
              <h1 className="text-5xl font-normal drop-shadow-lg font-[Montserrat]  ">Contact Us</h1>
            </div>
          </ScrollAnimation>
        </div>
      </div>

      {/* Contact Information Section */}
      <div className="container mx-auto px-[10%] py-20">
        <div className="grid md:grid-cols-3 gap-12">
          {/** Contact Cards **/}
          {[{
            icon: <Phone className="h-8 w-8 text-[#22c984] group-hover:text-black transition-colors" />, title: "Give us a call", content: ["(+1) 400-630 123", "(+2) 500-950 456"]
          }, {
            icon: <Mail className="h-8 w-8 text-[#22c984] group-hover:text-black transition-colors" />, title: "Drop us a line", content: ["info@techwix-theme.com", "mail@techwix-tech.com"]
          }, {
            icon: <MapPin className="h-8 w-8 text-[#22c984] group-hover:text-black transition-colors" />, title: "Visit our office", content: ["New York, 112 W 34th St", "caroline, USA"]
          }].map((item, index) => (
            <ScrollAnimation key={index} direction={index === 0 ? "left" : index === 1 ? "up" : "right"}>
              <div className="bg-white shadow-lg p-8 rounded-lg text-center hover:shadow-2xl transition-shadow border border-transparent hover:border-[#22c984] relative group before:absolute before:inset-0 before:border before:border-[#22c984]/50 before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100">
                <div className="flex justify-center mb-6">
                  <div className="bg-blue-100 p-4 rounded-full">
                    {item.icon}
                  </div>
                </div>
                <h2 className="text-2xl font-normal mb-4 group-hover:text-[#22c984] transition-colors font-[Montserrat]">{item.title}</h2>
                <div className="space-y-2 text-gray-600 font-[Nethead] font-[400]">
                  {item.content.map((text, idx) => <p key={idx}>{text}</p>)}
                </div>
              </div>
            </ScrollAnimation>
          ))}
        </div>
      </div>
    </main>
  )
}
