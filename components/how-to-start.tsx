import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ScrollAnimation } from "./GlobalScrollAnimation";
export default function HowToStart() {
  const steps = [
    {
      icon: "/name.svg",
      title: "Choose & reserve a name",
      description:
        "It's wise to check your LLC name against similar businesses in your area. We include a business name check with our formation services and can reserve a preferred business name for you.",
    },
    {
      icon: "/agent.svg",
      title: "Pick a registered agent",
      description:
        "Also called a statutory agent or resident agent, a registered agent receives your LLC's Orizen notices and Orizen documents during normal business hours. Most states require it, and we can do it for you.",
    },
    {
      icon: "/organization.svg",
      title: "File articles of organization",
      description:
        "Also called a certificate of formation, this official form contains all the basic details about your new business. When we file this for you, it's typically sent to your Secretary of State.",
    },
    {
      icon: "/license.svg",
      title: "Determine licenses needed",
      description:
        "You'll also need to apply for any specific business licenses or permits that may be required for compliance, although it's wise to wait until your LLC's formation documents are approved.",
    },
    {
      icon: "/craft.svg",
      title: "Craft operating agreement",
      description:
        "This outlines your LLC's rules for everything from business structure to profit distribution. Our templates make it easy for LLC owners to define their rights and limit disagreements.",
    },
    {
      icon: "/ein.svg",
      title: "Get an EIN (federal tax ID)",
      description:
        "Most businesses need a federal tax ID to set up a business bank account, file taxes, and start hiring. It helps protect your identity by keeping your personal and business finances separate.",
    },
  ]

  return (
    <ScrollAnimation>
    <div id="how" className="bg-[#f9f6f1] py-20 px-[5%] mt-20">
      <div className="container mx-auto px-6 md:px-12 lg:px-20">
        <h2 style={{ fontFamily: "Montserrat", fontSize: "40px", fontWeight: "500", background: "none" }} className="text-center mb-12 text-gray-900">
          How to start an LLC
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center text-center transition-transform duration-300 hover:shadow-lg hover:scale-105">
              <div className="bg-[#fff9e9] rounded-xl mb-4 w-full flex items-center justify-center shadow-sm overflow-hidden">
                <Image
                  src={step.icon || "/placeholder.svg"}
                  alt={step.title}
                  width={263}
                  height={340}
                  className="w-[263] h-[200px] object-contain rotate-[-60deg]"
                />
              </div>
              <h3 style={{ fontFamily: "Montserrat", fontSize: "20px", fontWeight: "500" }} className="mb-3 text-gray-900">{step.title}</h3>
              <p style={{ fontFamily: "Nethead", fontSize: "16px" }} className="text-gray-600 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
<div className="mt-20 flex justify-center px-[18%]">
  <div className="bg-[#1a3449] rounded-2xl p-8 md:p-10 px-10 w-full max-w-[780px] flex flex-col md:flex-row items-center justify-between text-center md:text-left gap-4">
  <h3
  style={{
    fontFamily: "Amy Medium",
    fontSize: "45px",
    fontWeight: "500",
    lineHeight: "1.2", // Adjust this value if needed
  }}
  className="text-white ml-[50px]"
>
  Ready to get<br /> your LLC?
</h3>


<Button className="bg-[#22c984] hover:bg-[#1eac73] text-white px-[98px] py-4 text-lg rounded-[10px] shadow-lg transform transition-transform duration-300 hover:scale-105 mr-[50px]">
  Start my LLC
</Button>
  </div>
</div>
      </div>
    </div>
    </ScrollAnimation>
  )
}
