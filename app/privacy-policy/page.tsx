import Hero from "@/components/hero-sec"
import PolicyContent from "@/components/PolicyContent"
import FAQSection from "@/components/FAQSection"
import ContactSection from "@/components/ContactSection"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy - How Orizen Inc Protects Your Information",
  description:
    "Read Orizen Inc's Privacy Policy to learn how we collect, use, and safeguard your personal information when using our business formation and LLC services.",
}

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Hero
        title="Privacy Policy"
        subtitle="Learn how we protect and manage your information"
        backgroundImage="/expo.webp"
      />
      <PolicyContent>
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Commitment to Your Privacy</h2>
        <p className="text-lg mb-8">
          At our company, we take your privacy seriously. This policy outlines how we collect, use, and protect your
          personal information.
        </p>

        <h3 className="text-2xl font-semibold text-green-600 mb-4">1. Information We Collect</h3>
        <p className="mb-6">
          We collect information you provide directly to us, such as when you create or modify your account, request
          on-demand services, contact customer support, or otherwise communicate with us.
        </p>

        <h3 className="text-2xl font-semibold text-green-600 mb-4">2. How We Use Your Information</h3>
        <p className="mb-6">
          We use the information we collect about you to provide, maintain, and improve our Services, such as to process
          transactions, send you related information, and provide customer support.
        </p>

        <h3 className="text-2xl font-semibold text-green-600 mb-4">3. Sharing of Information</h3>
        <p className="mb-4">
          We may share the information we collect about you as described in this policy or as disclosed at the time of
          collection or sharing, including as follows:
        </p>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li>
            With third-party vendors, consultants, and other service providers who need access to such information to
            carry out work on our behalf;
          </li>
          <li>
            In response to a request for information if we believe disclosure is in accordance with any applicable law,
            regulation, or legal process;
          </li>
          <li>
            If we believe your actions are inconsistent with our user agreements or policies, or to protect the rights,
            property, and safety of us or any third party.
          </li>
        </ul>

        <h3 className="text-2xl font-semibold text-green-600 mb-4">4. Your Choices</h3>
        <p className="mb-6">
          You may update, correct, or delete information about you at any time by logging into your online account or by
          contacting us. If you wish to delete or deactivate your account, please email us, but note that we may retain
          certain information as required by law or for legitimate business purposes.
        </p>

        <h3 className="text-2xl font-semibold text-green-600 mb-4">5. Changes to this Policy</h3>
        <p className="mb-6">
          We may change this privacy policy from time to time. If we make changes, we will notify you by revising the
          date at the top of the policy and, in some cases, we may provide you with additional notice (such as adding a
          statement to our homepage or sending you a notification).
        </p>
      </PolicyContent>
      <FAQSection />
      <ContactSection />
    </main>
  )
}

