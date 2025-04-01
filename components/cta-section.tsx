import Image from "next/image"
import { Button } from "@/components/ui/button"
import { FaStore, FaCheckCircle, FaClipboardList } from "react-icons/fa"
import { ScrollAnimation } from "./GlobalScrollAnimation"

export default function CTASection() {
  return (
    <>
      {/* CTA Section */}
      <ScrollAnimation>
        <div className="bg-[#fdf1e2] py-6 sm:py-8 rounded-lg sm:rounded-xl mx-3 sm:mx-6 md:mx-auto max-w-5xl shadow-md my-8 sm:my-12 overflow-x-hidden">
          <div className="container mx-auto px-4 md:px-8 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
            <div className="w-full md:w-1/2 text-center md:text-left">
              <h2
                className="font-medium mb-2 sm:mb-3 text-gray-900 text-xl sm:text-2xl md:text-[30px]"
                style={{ fontFamily: "Montserrat" }}
              >
                Ready to get your LLC?
              </h2>
              <p
                className="text-sm sm:text-base md:text-lg mb-4 sm:mb-6 text-gray-700"
                style={{ fontFamily: "Nethead" }}
              >
                Start your LLC with the <span className="font-bold">industry leader</span> in online business formation.
              </p>
              <div className="mt-3 sm:mt-4 flex justify-center md:justify-start">
                <Button className="py-2 sm:py-3 text-sm sm:text-base md:text-lg bg-[#22c984] hover:bg-[#1eac73] text-white rounded-md shadow-md w-full sm:w-auto px-4 sm:px-6 md:px-8 lg:px-12">
                  Start my LLC
                </Button>
              </div>
            </div>
            <div className="w-full md:w-1/2 flex justify-center mt-4 md:mt-0">
              <Image
                src="/cta.webp"
                alt="Start your LLC"
                width={350}
                height={250}
                className="w-[80%] sm:w-auto h-auto max-w-full"
              />
            </div>
          </div>
        </div>
      </ScrollAnimation>

      {/* Steps Section */}
      <ScrollAnimation>
        <div className="bg-[#f9f6f1] py-10 sm:py-16 md:py-20 overflow-x-hidden">
          <div className="container mx-auto px-4 sm:px-6 md:px-12 lg:px-20">
            <h2
              className="text-center font-medium mb-8 sm:mb-12 md:mb-16 text-gray-900 text-2xl sm:text-3xl md:text-[40px]"
              style={{ fontFamily: "Montserrat" }}
            >
              Use Orizen Inc to start your business{" "}
              <span className="hidden sm:inline">
                <br />
              </span>{" "}
              in 3 easy steps
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-4">
              {[
                {
                  number: "01",
                  icon: <FaStore />,
                  title: "Tell us about your business",
                  description: "Let us know basic details about your business.",
                },
                {
                  number: "02",
                  icon: <FaCheckCircle />,
                  title: "Choose the services you need",
                  description: "Take your business to the next level with Orizen Inc's services.",
                },
                {
                  number: "03",
                  icon: <FaClipboardList />,
                  title: "Sit back while we make it official",
                  description: "Let us take care of the rest while you get back to business!",
                },
              ].map((step, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 text-left border border-gray-200 flex flex-col items-start w-full sm:w-[95%] md:w-[90%] mx-auto transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:border-[#1eac73] group"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center bg-gray-100 rounded-full mb-3 sm:mb-4 transition-all duration-300 group-hover:text-black">
                    <span className="text-xl sm:text-2xl md:text-[30px] text-[#22c984] group-hover:text-black">
                      {step.icon}
                    </span>
                  </div>
                  <div
                    className="text-5xl sm:text-6xl md:text-[90px] font-medium text-gray-900 mb-2 sm:mb-4 transition-all duration-300 group-hover:text-[#22c984]"
                    style={{ fontFamily: "Amy Medium" }}
                  >
                    {step.number}
                  </div>
                  <h3
                    className="text-lg sm:text-xl font-medium mb-2 sm:mb-3 text-gray-900"
                    style={{ fontFamily: "Montserrat" }}
                  >
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-sm sm:text-base" style={{ fontFamily: "Nethead" }}>
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollAnimation>
    </>
  )
}

