import {
  ShieldCheck,
  Handshake,
  DollarSign,
  Users,
  Building2,
  AlertTriangle,
  Receipt,
  Wallet,
  BarChart4,
  FileText,
} from "lucide-react"
import { ScrollAnimation } from "./GlobalScrollAnimation"

export default function LLCBenefits() {
  return (
    <ScrollAnimation>
      <div className="bg-white py-10 sm:py-16 md:py-20 overflow-x-hidden">
        {/* 3 Reasons Section */}
        <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-[10%] overflow-hidden">
          <h2
            style={{ fontFamily: "'Montserrat', Nethead" }}
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium text-center mb-6 sm:mb-8 md:mb-12 text-gray-900"
          >
            3 reasons for creating an LLC
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {[
              {
                icon: <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-[#22c984]" />,
                title: "Protect your assets",
                description:
                  "By forming an LLC and keeping your personal finances separate, you can protect your personal assets from business liabilities.",
              },
              {
                icon: <Handshake className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-[#1eac73]" />,
                title: "Make things easier",
                description:
                  "It's typically easier to form an LLC than a corporation, and there are simpler rules for things like record-keeping.",
              },
              {
                icon: <DollarSign className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-[#0f4e35]" />,
                title: "Get tax flexibility",
                description:
                  "You get to decide how you're taxed—as an LLC or a corporation—to maximize your ability to save money and minimize tax liability.",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-white border rounded-md sm:rounded-lg p-4 sm:p-5 md:p-6 shadow-md transition-transform transform hover:scale-105 hover:shadow-lg"
              >
                <div className="mb-3 sm:mb-4">{item.icon}</div>
                <h3
                  style={{ fontFamily: "'Montserrat', Nethead" }}
                  className="text-base sm:text-lg md:text-xl font-medium mb-2 sm:mb-3 text-gray-900"
                >
                  {item.title}
                </h3>
                <p
                  style={{ fontFamily: "'Nethead', sans-serif" }}
                  className="text-gray-600 text-xs sm:text-sm leading-relaxed"
                >
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* LLC vs Sole Proprietorship Section */}
        <section className="py-10 sm:py-12 md:py-16 bg-[#F5F3F0] mt-8 sm:mt-10 md:mt-[60px] px-4 sm:px-8 md:px-12 lg:px-[18%] overflow-x-hidden">
          <div className="max-w-7xl mx-auto overflow-hidden">
            <h2
              style={{ fontFamily: "'Montserrat', Nethead" }}
              className="text-2xl sm:text-3xl md:text-4xl font-medium text-center mb-2 sm:mb-3 md:mb-4"
            >
              LLC vs. sole proprietorship:
              <br className="hidden sm:block" />
              What's the difference?
            </h2>
            <p
              style={{ fontFamily: "'Nethead', sans-serif" }}
              className="text-center text-gray-600 text-sm sm:text-base mb-6 sm:mb-8 md:mb-12 px-2"
            >
              There are several important differences between an LLC and a sole proprietorship:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-10">
              {/* LLC Column */}
              <div className="bg-white p-5 sm:p-6 md:p-8 rounded-lg shadow-sm border border-gray-100 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:border-[#22c984]">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <div className="text-xs sm:text-sm text-gray-500">LLC VS SOLE PROPRIETORSHIP</div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[#FFE5E0] flex items-center justify-center">
                    <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#22c984]" />
                  </div>
                </div>
                <h3
                  style={{ fontFamily: "'Montserrat', Nethead" }}
                  className="text-xl sm:text-2xl font-medium mb-5 sm:mb-8"
                >
                  LLC
                </h3>
                <hr className="border-t-1 border-gray-200 mb-4 sm:mb-6" />

                <div className="space-y-5 sm:space-y-8">
                  <div className="flex gap-3 sm:gap-4">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 flex-shrink-0 mt-1" />
                    <div>
                      <h4
                        style={{ fontFamily: "'Montserrat', Nethead" }}
                        className="font-medium mb-1 sm:mb-2 text-sm sm:text-base"
                      >
                        Flexible management structure
                      </h4>
                      <p style={{ fontFamily: "'Nethead', sans-serif" }} className="text-gray-600 text-xs sm:text-sm">
                        LLC owners have more freedom to decide how the business is run and managed.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 sm:gap-4">
                    <BarChart4 className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 flex-shrink-0 mt-1" />
                    <div>
                      <h4
                        style={{ fontFamily: "'Montserrat', Nethead" }}
                        className="font-medium mb-1 sm:mb-2 text-sm sm:text-base"
                      >
                        More taxation options
                      </h4>
                      <p style={{ fontFamily: "'Nethead', sans-serif" }} className="text-gray-600 text-xs sm:text-sm">
                        An LLC has flexibility in how it is taxed to help maximize savings.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 sm:gap-4">
                    <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 flex-shrink-0 mt-1" />
                    <div>
                      <h4
                        style={{ fontFamily: "'Montserrat', Nethead" }}
                        className="font-medium mb-1 sm:mb-2 text-sm sm:text-base"
                      >
                        Minimal record-keeping
                      </h4>
                      <p style={{ fontFamily: "'Nethead', sans-serif" }} className="text-gray-600 text-xs sm:text-sm">
                        An LLC does not need to record minutes or hold an annual shareholder meeting.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sole Proprietorship Column */}
              <div className="bg-white p-5 sm:p-6 md:p-8 rounded-lg shadow-sm border border-gray-100 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:border-[#22c984]">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <div className="text-xs sm:text-sm text-gray-500">LLC VS SOLE PROPRIETORSHIP</div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[#FFE5E0] flex items-center justify-center">
                    <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-[#22c984]" />
                  </div>
                </div>
                <h3
                  style={{ fontFamily: "'Montserrat', Nethead" }}
                  className="text-xl sm:text-2xl font-medium mb-5 sm:mb-8"
                >
                  Sole Proprietorship
                </h3>
                <hr className="border-t-1 border-gray-200 mb-4 sm:mb-6" />

                <div className="space-y-5 sm:space-y-8">
                  <div className="flex gap-3 sm:gap-4">
                    <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 flex-shrink-0 mt-1" />
                    <div>
                      <h4
                        style={{ fontFamily: "'Montserrat', Nethead" }}
                        className="font-medium mb-1 sm:mb-2 text-sm sm:text-base"
                      >
                        Less Credibility
                      </h4>
                      <p style={{ fontFamily: "'Nethead', sans-serif" }} className="text-gray-600 text-xs sm:text-sm">
                        A sole proprietorship may appear less professional compared to an LLC.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 sm:gap-4">
                    <Receipt className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 flex-shrink-0 mt-1" />
                    <div>
                      <h4
                        style={{ fontFamily: "'Montserrat', Nethead" }}
                        className="font-medium mb-1 sm:mb-2 text-sm sm:text-base"
                      >
                        Higher Tax Burden
                      </h4>
                      <p style={{ fontFamily: "'Nethead', sans-serif" }} className="text-gray-600 text-xs sm:text-sm">
                        The owner must pay self-employment taxes on all profits, with fewer tax-saving options than an
                        LLC.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 sm:gap-4">
                    <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 flex-shrink-0 mt-1" />
                    <div>
                      <h4
                        style={{ fontFamily: "'Montserrat', Nethead" }}
                        className="font-medium mb-1 sm:mb-2 text-sm sm:text-base break-words"
                      >
                        No Separation of Personal & Business Finances
                      </h4>
                      <p style={{ fontFamily: "'Nethead', sans-serif" }} className="text-gray-600 text-xs sm:text-sm">
                        Personal and business finances are intertwined, increasing financial risks.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </ScrollAnimation>
  )
}

