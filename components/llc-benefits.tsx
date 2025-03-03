import { ShieldCheck, Handshake, DollarSign, Users, Building2, Landmark, BarChart4, FileText,  TrendingUp } from "lucide-react";
import { ScrollAnimation } from "./GlobalScrollAnimation";

export default function LLCBenefits() {
  return (
    <ScrollAnimation>
    <div className="bg-white py-20">
      {/* 3 Reasons Section */}
      <div className="container mx-auto px-[10%]">
        <h2 style={{ fontFamily: "'Montserrat', Nethead" }} className="text-4xl font-medium md:text-5xl text-center mb-12 text-gray-900">
          3 reasons for creating an LLC
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <ShieldCheck className="w-8 h-8 text-[#22c984]" />, 
              title: "Protect your assets",
              description:
                "By forming an LLC and keeping your personal finances separate, you can protect your personal assets from business liabilities.",
            },
            {
              icon: <Handshake className="w-8 h-8 text-[#1eac73]" />, 
              title: "Make things easier",
              description:
                "It&apos;s typically easier to form an LLC than a corporation, and there are simpler rules for things like record-keeping.",
            },
            {
              icon: <DollarSign className="w-8 h-8 text-[#0f4e35]" />, 
              title: "Get tax flexibility",
              description:
                "You get to decide how you&apos;re taxed—as an LLC or a corporation—to maximize your ability to save money and minimize tax liability.",
            },
          ].map((item, index) => (
            <div key={index} className="bg-white border rounded-lg p-6 shadow-md transition-transform transform hover:scale-105 hover:shadow-lg">
              <div className="mb-4">{item.icon}</div>
              <h3 style={{ fontFamily: "'Montserrat', Nethead" }} className="text-lg font-medium semi mb-3 text-gray-900">{item.title}</h3>
              <p style={{ fontFamily: "'Nethead', sans-serif" }} className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* LLC vs Corporation Section */}
      <section className="py-16 bg-[#F5F3F0] mt-[60px] px-[18%]">
        <div className="max-w-7xl mx-auto px-4">
          <h2 style={{ fontFamily: "'Montserrat', Nethead" }} className="text-4xl font-medium text-center mb-4">
            LLC vs. corporation:
            <br />
            What&apos;s the difference?
          </h2>
          <p style={{ fontFamily: "'Nethead', sans-serif" }} className="text-center text-gray-600 mb-12">
            There are several important differences between an LLC and a corporation:
          </p>

          <div className="grid md:grid-cols-2 gap-10">
            {/* LLC Column */}
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:border-[#22c984]">
              <div className="flex items-center justify-between mb-6">
                <div className="text-sm text-gray-500">LLC VS CORPORATION</div>
                <div className="w-10 h-10 rounded-lg bg-[#FFE5E0] flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-[#22c984]" />
                </div>
              </div>
              <h3 style={{ fontFamily: "'Montserrat', Nethead" }} className="text-2xl font-medium mb-8">LLC</h3>
              <hr className="border-t-1 border-gray-200 mb-6" />

              <div className="space-y-8">
                <div className="flex gap-4">
                  <Users className="w-6 h-6 text-gray-400 flex-shrink-0" />
                  <div>
                    <h4 style={{ fontFamily: "'Montserrat', Nethead" }} className="font-medium mb-2">Flexible management structure</h4>
                    <p style={{ fontFamily: "'Nethead', sans-serif" }} className="text-gray-600">
                      LLC owners have more freedom to decide how the business is run and managed.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <BarChart4 className="w-6 h-6 text-gray-400 flex-shrink-0" />
                  <div>
                    <h4 style={{ fontFamily: "'Montserrat', Nethead" }} className="font-medium mb-2">More taxation options</h4>
                    <p style={{ fontFamily: "'Nethead', sans-serif" }} className="text-gray-600">
                      An LLC has flexibility in how it is taxed to help maximize savings.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <FileText className="w-6 h-6 text-gray-400 flex-shrink-0" />
                  <div>
                    <h4 style={{ fontFamily: "'Montserrat', Nethead" }} className="font-medium mb-2">Minimal record-keeping</h4>
                    <p style={{ fontFamily: "'Nethead', sans-serif" }} className="text-gray-600">
                      An LLC does not need to record minutes or hold an annual shareholder meeting.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Corporation Column */}
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:border-[#22c984]">
              <div className="flex items-center justify-between mb-6">
                <div className="text-sm text-gray-500">LLC VS CORPORATION</div>
                <div className="w-10 h-10 rounded-lg bg-[#FFE5E0] flex items-center justify-center">
                  <Landmark className="w-5 h-5 text-[#22c984]" />
                </div>
              </div>
              <h3 style={{ fontFamily: "'Montserrat', Nethead" }} className="text-2xl font-medium mb-8">Corporation</h3>
              <hr className="border-t-1 border-gray-200 mb-6" />

              <div className="space-y-8">
                <div className="flex gap-4">
                  <Users className="w-6 h-6 text-gray-400 flex-shrink-0" />
                  <div>
                    <h4 style={{ fontFamily: "'Montserrat', Nethead" }} className="font-medium mb-2">Owned by shareholders</h4>
                    <p style={{ fontFamily: "'Nethead', sans-serif" }} className="text-gray-600">
                      Corporations have shareholders instead of members, and they issue stock.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Building2 className="w-6 h-6 text-gray-400 flex-shrink-0" />
                  <div>
                    <h4 style={{ fontFamily: "'Montserrat', Nethead" }} className="font-medium mb-2">Look more official</h4>
                    <p style={{ fontFamily: "'Nethead', sans-serif" }} className="text-gray-600">
                      Corporations are often seen as more credible, which can make it easier to do business with other companies.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <TrendingUp className="w-6 h-6 text-gray-400 flex-shrink-0" />
                  <div>
                    <h4 style={{ fontFamily: "'Montserrat', Nethead" }} className="font-medium mb-2">More appealing to investors</h4>
                    <p style={{ fontFamily: "'Nethead', sans-serif" }} className="text-gray-600">
                      A C corp, but not an S corp, can go public and issue stock to new investors, which makes it easier to raise revenue.
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
  );
}
