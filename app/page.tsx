import Hero from '@/components/hero'
import { PricingCards } from "@/components/pricing"
import DetailedFeatures from '@/components/detailed-features'
import WhyUseOrizen from '@/components/why-use-orizen'
import CTASection from '@/components/cta-section'
import LLCBenefits from '@/components/llc-benefits'
import InfoVideoSection from '@/components/InfoVideoSection'
import HowToStart from '@/components/how-to-start'
import FAQSection from '@/components/faq-section'
import CustomerSuccess from '@/components/customer-success'
import StateSelector from '@/components/state-selector'
import ReadySection from '@/components/ready-section'
export default function Home() {
  return (
    <main>
      <Hero />
      <PricingCards />    
        <DetailedFeatures />
      <WhyUseOrizen />
      <CTASection />
      <LLCBenefits />
      <InfoVideoSection />
      <HowToStart />
      <FAQSection />
      <CustomerSuccess />
      <StateSelector />
      <ReadySection />
    </main>
  )
}
