import HeroSection from "@/app/about/herosection"
import NeedProject from "@/app/about/need-project-section"
import WhyChooseUs from "@/app/about/why-choose-us"

export default function AboutUs() {
  return (
    <main className="overflow-x-hidden w-full">
      <HeroSection />
      <NeedProject />
      <WhyChooseUs />
    </main>
  )
}

