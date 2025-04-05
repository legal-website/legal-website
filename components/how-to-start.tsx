import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ScrollAnimation } from "./GlobalScrollAnimation"
import Link from "next/link"

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
        "Also called a statutory agent or resident agent, a registered agent receives your LLC's Orizen Inc notices and Orizen Inc documents during normal business hours. Most states require it, and we can do it for you.",
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
      <div
        id="how"
        className="bg-[#f9f6f1] py-10 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8 mt-10 sm:mt-16 md:mt-20 overflow-x-hidden"
      >
        <div className="container mx-auto md:px-[4%]">
          <h2
            className="text-center mb-8 sm:mb-10 md:mb-12 text-gray-900 text-2xl sm:text-3xl md:text-4xl font-medium"
            style={{ fontFamily: "Montserrat", background: "none" }}
          >
            How to start an LLC
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {steps.map((step, index) => (
              <div
                key={index}
                className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-md p-4 sm:p-5 md:p-6 flex flex-col items-center text-center transition-transform duration-300 hover:shadow-lg hover:scale-105"
              >
                <div className="bg-[#fff9e9] rounded-lg sm:rounded-xl mb-3 sm:mb-4 w-full flex items-center justify-center shadow-sm overflow-hidden">
                  <Image
                    src={step.icon || "/placeholder.svg"}
                    alt={step.title}
                    width={263}
                    height={200}
                    className="w-full max-w-[200px] sm:max-w-[230px] md:max-w-[263px] h-[150px] sm:h-[180px] md:h-[200px] object-contain rotate-[-60deg]"
                  />
                </div>
                <h3
                  className="mb-2 sm:mb-3 text-gray-900 text-base sm:text-lg md:text-xl font-medium"
                  style={{ fontFamily: "Montserrat" }}
                >
                  {step.title}
                </h3>
                <p
                  className="text-gray-600 leading-relaxed text-sm sm:text-base break-words"
                  style={{ fontFamily: "Nethead" }}
                >
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="mt-10 sm:mt-16 md:mt-20 flex justify-center px-4 sm:px-8 md:px-12 lg:px-16 md:-mx-[4%]">
            <div className="bg-[#1a3449] rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-10 w-full max-w-[780px] flex flex-col md:flex-row items-center justify-between text-center md:text-left gap-4 md:gap-6">
              <h3
                className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-[45px] font-medium leading-tight md:ml-0 lg:ml-6"
                style={{ fontFamily: "Amy Medium" }}
              >
                Ready to get
                <br /> your LLC?
              </h3>
              <Link href="/#pricing" scroll={true}>
              <Button className="bg-[#22c984] hover:bg-[#1eac73] text-white w-full md:w-auto px-6 sm:px-8 md:px-12 lg:px-16 py-3 sm:py-4 text-base sm:text-lg rounded-[10px] shadow-lg transform transition-transform duration-300 hover:scale-105 md:mr-0 lg:mr-6">
                Start my LLC
              </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ScrollAnimation>
  )
}

