import Hero from "@/components/hero"
import Pricing from "@/components/pricing"
import DetailedFeatures from "@/components/detailed-features"
import WhyUseOrizen from "@/components/why-use-orizen"
import CTASection from "@/components/cta-section"
import LLCBenefits from "@/components/llc-benefits"
import InfoVideoSection from "@/components/InfoVideoSection"
import HowToStart from "@/components/how-to-start"
import FAQs from "@/components/FAQs"
import CustomerSuccess from "@/components/customer-success"
import StateSelector from "@/components/state-selector"
import ReadySection from "@/components/ready-section"

export default function Home() {
  return (
    <main className="w-full overflow-x-hidden relative z-0">
      <div className="max-w-[100vw] relative z-0">
        <Hero />
        <Pricing />
        <DetailedFeatures />
        <WhyUseOrizen />
        <CTASection />
        <LLCBenefits />
        <InfoVideoSection />
        <HowToStart />
        <FAQs />
        <CustomerSuccess />
        <StateSelector />
        <ReadySection />
      </div>
    </main>
  )
}

