import type { Metadata } from "next"
import ContactPageClient from "./ContactPageClient"

export const metadata: Metadata = {
  title: "Contact Orizen Inc - Get in Touch with Our Team",
  description:
    "Have questions or need support? Contact Orizen Inc for assistance with business formation, LLC services, and general inquiries. Our team is here to help you.",
}

export default function ContactPage() {
  return <ContactPageClient />
}

