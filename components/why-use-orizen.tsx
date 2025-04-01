import { Rocket, ShieldCheck, Users } from "lucide-react"
import { ScrollAnimation } from "./GlobalScrollAnimation"

export default function WhyUseOrizen() {
  return (
    <ScrollAnimation>
      <div id="whyuse" className="bg-[#f9f6f1] py-10 sm:py-16 md:py-20 overflow-x-hidden">
        <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
          {/* Why use Orizen section */}
          <h2
            className="text-2xl sm:text-3xl md:text-[40px] font-medium text-center mb-6 sm:mb-8 md:mb-12 text-gray-900"
            style={{ fontFamily: "Montserrat" }}
          >
            Why use Orizen to set up your LLC?
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            {[
              {
                icon: <Rocket className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-blue-500" />,
                title: "Kickstart in minutes",
                text: "Start your LLC in 3 easy steps with the industry leader in online business formation.",
              },
              {
                icon: <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-[#22c984]" />,
                title: "Set it up right",
                text: "Our tools offer step-by-step guidance to help you launch and protect your new business.",
              },
              {
                icon: <Users className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-yellow-500" />,
                title: "Get the help you need",
                text: "Our network of experienced professionals can assist your launch and help you grow.",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-white px-4 sm:px-6 md:px-8 lg:px-12 py-4 sm:py-5 md:py-6 rounded-xl sm:rounded-2xl shadow-md flex flex-col items-start transition-transform transform hover:scale-105 hover:shadow-xl duration-300"
              >
                <div className="mb-3 md:mb-4 p-2 sm:p-3 rounded-full bg-gray-100 transition-all duration-300 hover:bg-opacity-80 hover:shadow-lg">
                  {item.icon}
                </div>
                <h3
                  className="text-lg sm:text-xl md:text-[22px] font-normal mb-1 sm:mb-2 text-gray-900"
                  style={{ fontFamily: "Montserrat" }}
                >
                  {item.title}
                </h3>
                <p
                  className="text-sm sm:text-base md:text-[15px] text-gray-700 font-normal leading-relaxed"
                  style={{ fontFamily: "Nethead" }}
                >
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ScrollAnimation>
  )
}

