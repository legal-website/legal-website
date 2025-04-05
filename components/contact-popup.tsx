"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FileText, Mail, Phone, MessageSquare } from "lucide-react"

export function ContactPopup() {
  const [isOpen, setIsOpen] = useState(false)

  const emails = [
    { address: "Hello@orizeninc.com", label: "General Inquiries" },
    { address: "info@orizeninc.com", label: "Information" },
    { address: "Support@orizeninc.com", label: "Support" },
  ]

  const phones = [
    { number: "+92 329 9438557", label: "Customer Support" },
    { number: "+92 337 8378594", label: "Sales" },
  ]

  const whatsapp = [
    { number: "+92 329 9438557", label: "Customer Support", link: "https://wa.link/nrfsdc" },
    { number: "+92 337 8378594", label: "Sales", link: "https://wa.link/p473ft" },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start h-auto py-4">
          <FileText className="w-5 h-5 mr-3" />
          <div className="text-left">
            <p className="font-semibold">Contact our Help Desk</p>
            <p className="text-sm text-gray-600 font-medium whitespace-normal leading-tight">
              Our team is ready to assist you with any questions
            </p>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Contact Orizen Inc Support</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {/* Two-column layout for Email and Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Email Section */}
            <div>
              <h3 className="text-lg font-semibold flex items-center mb-2">
                <Mail className="w-5 h-5 mr-2 text-blue-500" />
                Email Us
              </h3>
              <div className="space-y-2">
                {emails.map((email, index) => (
                  <a
                    key={index}
                    href={`mailto:${email.address}`}
                    className="block p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <p className="font-medium text-sm">{email.label}</p>
                    <p className="text-blue-600 text-sm break-all">{email.address}</p>
                  </a>
                ))}
              </div>
            </div>

            {/* Phone Section */}
            <div>
              <h3 className="text-lg font-semibold flex items-center mb-2">
                <Phone className="w-5 h-5 mr-2 text-green-500" />
                Call Us
              </h3>
              <div className="space-y-2">
                {phones.map((phone, index) => (
                  <a
                    key={index}
                    href={`tel:${phone.number}`}
                    className="block p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <p className="font-medium text-sm">{phone.label}</p>
                    <p className="text-green-600 text-sm">{phone.number}</p>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* WhatsApp Section - Full width below */}
          <div>
            <h3 className="text-lg font-semibold flex items-center mb-2">
              <MessageSquare className="w-5 h-5 mr-2 text-[#25D366]" />
              WhatsApp
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {whatsapp.map((wa, index) => (
                <a
                  key={index}
                  href={`https://${wa.link}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <p className="font-medium text-sm">{wa.label}</p>
                  <p className="text-[#25D366] text-sm">{wa.number}</p>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-gray-500 mt-2">
          Our support team is available Monday to Friday, 9 AM to 5 PM EST
        </div>
      </DialogContent>
    </Dialog>
  )
}

