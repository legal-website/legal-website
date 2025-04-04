import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Phone, MessageSquare } from "lucide-react";
import { ScrollAnimation } from "./GlobalScrollAnimation";
import Link from "next/link"

export default function ReadySection() {
  return (
    <>
      {/* Ready to get LLC Section */}
      <ScrollAnimation>
        <div className="bg-white pt-20 px-8 mb-[100px] ">
          <div className="container mx-auto flex justify-center">
            <div className="bg-[#FFF2D0] max-w-[1000px] w-full py-12 px-8 rounded-2xl shadow-md relative">
              <div className="grid md:grid-cols-2 items-center gap-8">
                <div>
                  <h2
                    className="text-[40px] font-[500] text-gray-900 mb-4"
                    style={{ fontFamily: "Montserrat" }}
                  >
                    Ready to get your LLC?
                  </h2>
                  <p
                    className="text-[16px] text-gray-700 mb-6"
                    style={{ fontFamily: "Nethead" }}
                  >
                    Start your LLC with a top choice of millions for online small business formation.
                  </p>
                  <Link href="/#pricing" scroll={true}>
                  <Button className="px-[160px] py-3 text-[16px] bg-[#22c984] hover:bg-[#1eac73] text-white rounded-md shadow-md">
                    Start my LLC
                  </Button>
                  </Link>
                </div>
                <div className="absolute right-0 top-0 h-full flex items-center">
                  <Image src="/alpha.webp" alt="Support" width={350} height={200} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollAnimation>

      {/* Questions Section */}
      <ScrollAnimation>
        <div className="bg-[#f6f4f2] pt-16 pb-52 rounded-2xl mt-10 px-[10%]">
          <div className="container mx-auto">
            <h2
              className="text-[40px] font-[500] text-gray-900 mb-10 text-left"
              style={{ fontFamily: "Montserrat" }}
            >
              Questions?
            </h2>
            <div className="grid md:grid-cols-10 gap-8 items-center">
              <div className="col-span-3 text-left flex flex-col gap-4 mr-14">
                <div className="flex flex-col items-start gap-2">
                  <div className="bg-[#ffedd5] p-3 rounded-full w-fit">
                    <MessageSquare className="w-6 h-6 text-[#22c984]" />
                  </div>
                  <h3
                    className="text-[20px] font-[500]"
                    style={{ fontFamily: "Montserrat" }}
                  >
                    Ask an attorney
                  </h3>
                </div>
                <p
                  className="text-[16px] text-gray-600"
                  style={{ fontFamily: "Nethead" }}
                >
                  Get the right guidance with an attorney by your side.
                </p>
                <Link href="/contact">
                <Button className="text-[16px] font-[400] px-[80px] py-3 bg-[#22c984] hover:bg-[#1eac73] text-white rounded-md shadow-md">
                  Get Orizen help
                </Button>
                </Link>
              </div>

              <div className="col-span-3 text-left flex flex-col gap-4">
                <div className="flex flex-col items-start gap-2">
                  <div className="bg-[#ffedd5] p-3 rounded-full w-fit">
                    <Phone className="w-6 h-6 text-[#22c984]" />
                  </div>
                  <h3
                    className="text-[20px] font-[500]"
                    style={{ fontFamily: "Montserrat" }}
                  >
                    Call an agent at <br/>
                    <a
                      href="tel:(855)787-1221"
                      className="text-[#22c984] hover:underline"
                    >
                      (855) 787-1221
                    </a>
                  </h3>
                </div>
                <p
                  className="text-[16px] text-gray-600"
                  style={{ fontFamily: "Nethead" }}
                >
                  Mon–Fri 5 am–7 pm PT
                </p>
                <p
                  className="text-[16px] text-gray-600"
                  style={{ fontFamily: "Nethead" }}
                >
                  Sat–Sun 7 am–4 pm PT
                </p>
              </div>

              <div className="col-span-4">
                <Image
                  src="/sel.webp"
                  alt="Customer Support"
                  width={360}
                  height={240}
                  className="rounded-xl shadow-lg object-cover w-full h-[240px]"
                />
              </div>
            </div>
          </div>
        </div>
      </ScrollAnimation>
    </>
  );
}
