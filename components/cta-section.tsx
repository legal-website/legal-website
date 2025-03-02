import Image from "next/image";
import { Button } from "@/components/ui/button";
import { FaStore, FaCheckCircle, FaClipboardList } from "react-icons/fa";
import { ScrollAnimation } from "./GlobalScrollAnimation";

export default function CTASection() {
  return (
    <>
      {/* CTA Section */}
      <ScrollAnimation>
      <div className="bg-[#fdf1e2] py-8 rounded-xl mx-6 md:mx-auto max-w-5xl shadow-md my-12">
        <div className="container mx-auto px-4 md:px-8 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="w-full md:w-1/2 text-center md:text-left">
            <h2
              className="font-medium mb-3 text-gray-900"
              style={{ fontFamily: "Montserrat", fontSize: "30px" }}
            >
              Ready to get your LLC?
            </h2>
            <p
              className="text-base md:text-lg mb-6 text-gray-700"
              style={{ fontFamily: "Nethead" }}
            >
              Start your LLC with the{" "}
              <span className="font-bold">industry leader</span> in online business formation.
            </p>
            <div className="mt-4 flex justify-center md:justify-start">
              <Button
                className="py-3 text-base md:text-lg bg-[#22c984] hover:bg-[#1eac730] text-white rounded-md shadow-md w-full md:w-auto"
                style={{ paddingLeft: "160px", paddingRight: "160px" }}
              >
                Start my LLC
              </Button>
            </div>
          </div>
          <div className="w-full md:w-1/2 flex justify-center">
            <Image
              src="/cta.webp"
              alt="Start your LLC"
              width={350}
              height={250}
              className="w-auto h-auto"
            />
          </div>
        </div>
      </div>
      </ScrollAnimation>

      {/* Steps Section */}
      <ScrollAnimation>
      <div className="bg-[#f9f6f1] py-20">
        <div className="container mx-auto px-6 md:px-12 lg:px-20">
          <h2
            className="text-center font-medium mb-16 text-gray-900"
            style={{ fontFamily: "Montserrat", fontSize: "40px" }}
          >
            Use Orizen Inc to start your business <br /> in 3 easy steps
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
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
                className="bg-white rounded-2xl shadow-lg p-6 text-left border border-gray-200 flex flex-col items-start w-[90%] mx-auto transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:border-[#1eac730] group"
              >
                <div className="w-14 h-14 flex items-center justify-center bg-gray-100 rounded-full mb-4 transition-all duration-300 group-hover:text-black">
                  <span className="text-[30px] text-[#22c984] group-hover:text-black">
                    {step.icon}
                  </span>
                </div>
                <div
                  className="text-[90px] font-medium text-gray-900 mb-4 transition-all duration-300 group-hover:text-[#22c984]"
                  style={{ fontFamily: "Amy Medium" }}
                >
                  {step.number}
                </div>
                <h3
                  className="text-xl font-medium mb-3 text-gray-900"
                  style={{ fontFamily: "Montserrat" }}
                >
                  {step.title}
                </h3>
                <p
                  className="text-gray-600 text-base"
                  style={{ fontFamily: "Nethead" }}
                >
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
      </ScrollAnimation>
    </>
  );
}
