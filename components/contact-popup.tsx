"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FileText, Mail, Phone, MessageSquare, X } from "lucide-react"

export function ContactPopup() {
  const [isOpen, setIsOpen] = useState(false)

  const emails = [
    { address: "test@mail.com", label: "General Inquiries" },
    { address: "info@orizen.com", label: "Information" },
    { address: "orizeninc@gmail.com", label: "Support" },
  ]

  const phones = [
    { number: "+923165010567", label: "Customer Support" },
    { number: "+923135971857", label: "Sales" },
  ]

  const whatsapp = [
    { number: "+923165010567", label: "Customer Support", link: "demo.link.com" },
    { number: "+923135971857", label: "Sales", link: "demo2.link.com" },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start h-auto py-4">
          <FileText className="w-5 h-5 mr-3" />
          <div className="text-left">
            <p className="font-semibold">Contact our Help Desk</p>
            <p className="text-sm text-gray-600 font-medium">Our team is ready to assist you with any questions</p>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center">
            <span className="flex-1">Contact Orizen Support</span>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Email Section */}
          <div>
            <h3 className="text-lg font-semibold flex items-center mb-3">
              <Mail className="w-5 h-5 mr-2 text-blue-500" />
              Email Us
            </h3>
            <div className="space-y-2">
              {emails.map((email, index) => (
                <a
                  key={index}
                  href={`mailto:${email.address}`}
                  className="block p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <p className="font-medium">{email.label}</p>
                  <p className="text-blue-600">{email.address}</p>
                </a>
              ))}
            </div>
          </div>

          {/* Phone Section */}
          <div>
            <h3 className="text-lg font-semibold flex items-center mb-3">
              <Phone className="w-5 h-5 mr-2 text-green-500" />
              Call Us
            </h3>
            <div className="space-y-2">
              {phones.map((phone, index) => (
                <a
                  key={index}
                  href={`tel:${phone.number}`}
                  className="block p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <p className="font-medium">{phone.label}</p>
                  <p className="text-green-600">{phone.number}</p>
                </a>
              ))}
            </div>
          </div>

          {/* WhatsApp Section */}
          <div>
            <h3 className="text-lg font-semibold flex items-center mb-3">
              <MessageSquare className="w-5 h-5 mr-2 text-[#25D366]" />
              WhatsApp
            </h3>
            <div className="space-y-2">
              {whatsapp.map((wa, index) => (
                <a
                  key={index}
                  href={`https://${wa.link}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <p className="font-medium">{wa.label}</p>
                  <p className="text-[#25D366]">{wa.number}</p>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 text-center text-sm text-gray-500">
          Our support team is available Monday to Friday, 9 AM to 5 PM EST
        </div>
      </DialogContent>
    </Dialog>
  )
}

