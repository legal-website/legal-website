import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Phone, MessageSquare } from "lucide-react"
import { ScrollAnimation } from "./GlobalScrollAnimation"

export default function ReadySection() {
  return (
    <>
      {/* Ready to get LLC Section */}
      <ScrollAnimation>
        <div className="bg-white pt-10 sm:pt-16 md:pt-20 px-4 sm:px-6 md:px-8 sm:mb-16 md:mb-[100px] overflow-x-hidden mb-40">
          <div className="container mx-auto flex justify-center">
            <div className="bg-[#FFF2D0] w-full py-8 sm:py-10 md:py-12 px-4 sm:px-6 md:px-8 rounded-lg sm:rounded-xl md:rounded-2xl shadow-md relative">
              <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-6 md:gap-8">
                <div>
                  <h2
                    className="text-2xl sm:text-3xl md:text-[40px] font-[500] text-gray-900 mb-2 sm:mb-3 md:mb-4"
                    style={{ fontFamily: "Montserrat" }}
                  >
                    Ready to get your LLC?
                  </h2>
                  <p
                    className="text-sm sm:text-base md:text-[16px] text-gray-700 mb-4 sm:mb-5 md:mb-6"
                    style={{ fontFamily: "Nethead" }}
                  >
                    Start your LLC with a top choice of millions for online small business formation.
                  </p>
                  <Button className="w-full md:w-auto px-4 sm:px-6 md:px-8 py-2 sm:py-3 text-sm sm:text-base md:text-[16px] bg-[#22c984] hover:bg-[#1eac73] text-white rounded-md shadow-md">
                    Start my LLC
                  </Button>
                </div>
                <div className="mt-6 md:mt-0 md:absolute md:right-0 md:top-0 md:h-full md:flex md:items-center flex justify-center">
                  <Image
                    src="/alpha.webp"
                    alt="Support"
                    width={350}
                    height={200}
                    className="w-[200px] sm:w-[250px] md:w-[350px] h-auto object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollAnimation>

      {/* Questions Section */}
      <ScrollAnimation>
        <div className="bg-[#f6f4f2] pt-8 sm:pt-12 md:pt-16 pb-16 sm:pb-24 md:pb-52 rounded-lg sm:rounded-xl md:rounded-2xl mt-6 sm:mt-8 md:mt-10 px-4 sm:px-6 md:px-8 lg:px-[10%] overflow-x-hidden">
          <div className="container mx-auto">
            <h2
              className="text-2xl sm:text-3xl md:text-[40px] font-[500] text-gray-900 mb-6 sm:mb-8 md:mb-10 text-left"
              style={{ fontFamily: "Montserrat" }}
            >
              Questions?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-10 gap-8 items-start">
              <div className="lg:col-span-3 text-left flex flex-col gap-3 sm:gap-4 md:mr-0 lg:mr-14">
                <div className="flex flex-col items-start gap-2">
                  <div className="bg-[#ffedd5] p-2 sm:p-3 rounded-full w-fit">
                    <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-[#22c984]" />
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-[20px] font-[500]" style={{ fontFamily: "Montserrat" }}>
                    Ask an attorney
                  </h3>
                </div>
                <p className="text-sm sm:text-base md:text-[16px] text-gray-600" style={{ fontFamily: "Nethead" }}>
                  Get the right guidance with an attorney by your side.
                </p>
                <Button className="w-full sm:w-auto text-sm sm:text-base md:text-[16px] font-[400] px-4 sm:px-6 md:px-8 py-2 sm:py-3 bg-[#22c984] hover:bg-[#1eac73] text-white rounded-md shadow-md">
                  Get Orizen help
                </Button>
              </div>

              <div className="lg:col-span-3 text-left flex flex-col gap-3 sm:gap-4">
                <div className="flex flex-col items-start gap-2">
                  <div className="bg-[#ffedd5] p-2 sm:p-3 rounded-full w-fit">
                    <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-[#22c984]" />
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-[20px] font-[500]" style={{ fontFamily: "Montserrat" }}>
                    Call an agent at <br className="hidden sm:block" />
                    <a href="tel:(855)787-1221" className="text-[#22c984] hover:underline">
                      (855) 787-1221
                    </a>
                  </h3>
                </div>
                <p className="text-sm sm:text-base md:text-[16px] text-gray-600" style={{ fontFamily: "Nethead" }}>
                  Mon–Fri 5 am–7 pm PT
                </p>
                <p className="text-sm sm:text-base md:text-[16px] text-gray-600" style={{ fontFamily: "Nethead" }}>
                  Sat–Sun 7 am–4 pm PT
                </p>
              </div>

              <div className="lg:col-span-4 mt-6 md:mt-0">
                <Image
                  src="/sel.webp"
                  alt="Customer Support"
                  width={360}
                  height={240}
                  className="rounded-lg sm:rounded-xl shadow-lg object-cover w-full h-[180px] sm:h-[200px] md:h-[240px]"
                />
              </div>
            </div>
          </div>
        </div>
      </ScrollAnimation>
    </>
  )
}

