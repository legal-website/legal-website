"use client"
import Hero from "@/components/hero-sec"
import type { Metadata } from "next"
import PolicyContent from "@/components/PolicyContent"
import FAQSection from "@/components/FAQSection"
import ContactSection from "@/components/ContactSection"
export const metadata: Metadata = {
  title: "Terms and Conditions - Orizen Inc Service Agreement",
  description:
    "Review the Terms and Conditions for using Orizen Inc’s website and services. Understand your rights, responsibilities, and our service limitations.",
  keywords: "Orizen Inc terms and conditions, service agreement, user responsibilities, terms of use, legal terms, Orizen policies",
}
export default function TermsAndConditions() {
  return (
    <main className="min-h-screen bg-gray-50 mb-40">
      <Hero
        title="Terms and Conditions"
        subtitle="Please read these terms carefully before using our services"
        backgroundImage="/expo.webp"
      />
      <PolicyContent>
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Terms of Service</h2>
        <p className="text-lg mb-8">
          These terms govern your use of our services. By using our services, you agree to these terms.
        </p>

        <h3 className="text-2xl font-semibold text-green-600 mb-4">1. Acceptance of Terms</h3>
        <p className="mb-6">
          By accessing or using our services, you agree to be bound by these Terms and Conditions and all applicable
          laws and regulations. If you do not agree with any part of these terms, you may not use our services.
        </p>

        <h3 className="text-2xl font-semibold text-green-600 mb-4">2. Use of Services</h3>
        <p className="mb-6">
          You agree to use our services only for purposes that are permitted by these Terms and any applicable law,
          regulation, or generally accepted practices or guidelines in the relevant jurisdictions.
        </p>

        <h3 className="text-2xl font-semibold text-green-600 mb-4">3. User Accounts</h3>
        <p className="mb-6">
          To access certain features of our services, you may be required to create an account. You are responsible for
          maintaining the confidentiality of your account and password and for restricting access to your computer or
          device.
        </p>

        <h3 className="text-2xl font-semibold text-green-600 mb-4">4. Intellectual Property</h3>
        <p className="mb-6">
          The content, organization, graphics, design, compilation, magnetic translation, digital conversion, and other
          matters related to our services are protected under applicable copyrights, trademarks, and other proprietary
          rights.
        </p>

        <h3 className="text-2xl font-semibold text-green-600 mb-4">5. Limitation of Liability</h3>
        <p className="mb-6">
          In no event shall we be liable for any indirect, incidental, special, consequential or punitive damages,
          including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from
          your access to or use of or inability to access or use the services.
        </p>

        <h3 className="text-2xl font-semibold text-green-600 mb-4">6. Changes to Terms</h3>
        <p className="mb-6">
          We reserve the right to modify these terms at any time. We will always post the most current version on our
          site. By continuing to use our services after changes become effective, you agree to be bound by the revised
          terms.
        </p>
      </PolicyContent>
      <FAQSection />
      <ContactSection />
    </main>
  )
}

