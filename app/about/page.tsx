import type { Metadata } from "next"
import HeroSection from "@/app/about/herosection"
import NeedProject from "@/app/about/need-project-section"
import WhyChooseUs from "@/app/about/why-choose-us"
export const metadata: Metadata = {
  title: "About Orizen Inc - Our Mission & Values",
  description:
    "Learn about Orizen Inc, our mission to simplify business formation, and our commitment to providing exceptional service to entrepreneurs and small business owners.",
  keywords: "orizen Inc, about Orizen, business formation company, LLC services, company mission",
}
export default function AboutUs() {
  return (
    <main className="overflow-x-hidden w-full">
      <HeroSection />
      <NeedProject />
      <WhyChooseUs />
    </main>
  )
}

