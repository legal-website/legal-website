import Image from "next/image";
import { Rocket, ShieldCheck, Users } from "lucide-react";
import { ScrollAnimation } from "./GlobalScrollAnimation";

export default function WhyUseOrizen() {
  return (
    <ScrollAnimation>
    <div id = "whyuse" className="bg-[#f9f6f1] py-20">
      <div className="container mx-auto px-6 md:px-12 lg:px-20">
        {/* Why use Orizen section */}
        <h2 className="text-[40px] font-medium text-center mb-12 text-gray-900" style={{ fontFamily: 'Montserrat' }}>
          Why use Orizen to set up your LLC?
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: <Rocket className="w-10 h-10 text-blue-500" />, 
              title: "Kickstart in minutes", 
              text: "Start your LLC in 3 easy steps with the industry leader in online business formation.",
            },
            {
              icon: <ShieldCheck className="w-10 h-10 text-[#22c984]" />, 
              title: "Set it up right", 
              text: "Our tools offer step-by-step guidance to help you launch and protect your new business.",
            },
            {
              icon: <Users className="w-10 h-10 text-yellow-500" />, 
              title: "Get the help you need", 
              text: "Our network of experienced professionals can assist your launch and help you grow.",
            },
          ].map((item, index) => (
            <div 
              key={index} 
              className="bg-white px-12 py-6 rounded-2xl shadow-md flex flex-col items-start transition-transform transform hover:scale-105 hover:shadow-xl duration-300"
            >
              <div className="mb-4 p-3 rounded-full bg-gray-100 transition-all duration-300 hover:bg-opacity-80 hover:shadow-lg">
                {item.icon}
              </div>
              <h3 className="text-[22px] font-normal mb-2 text-gray-900" style={{ fontFamily: 'Montserrat' }}>{item.title}</h3>
              <p className="text-gray-700 text-[15px] font-normal leading-relaxed" style={{ fontFamily: 'Nethead' }}>{item.text}</p>
            </div>
          ))}
        </div>

        {/* What you need to know section */}
        <div className="mt-24">
          <h2 className="text-[40px] font-medium text-center mb-12 text-gray-900" style={{ fontFamily: 'Montserrat' }}>
            What you need to know about forming an LLC
          </h2>

          {[
            {
              title1: "What is an LLC?",
              text1:
                "A limited liability company (LLC) is a type of business entity you can register in your state. The main purpose of an LLC company is to limit the personal liability of its owners—like a C or S corporation—but it also allows the business to operate with simpler rules and more flexible tax requirements.",
              title2: "Do I need an LLC?",
              text2:
                "An LLC isn't always required, but many small business owners choose to form an LLC for personal liability protection. Having an LLC can also help you open bank accounts, enter into contracts, hire employees, and get necessary business licenses and permits.",
              img: "/hero.webp",
            },
            {
              title1: "What does LLC formation mean?",
              text1:
                "When you form an LLC, you submit a specific set of business forms to the state where you wish to create a new business entity. Once it's approved, you can use this separate entity to record business expenses, take on business debts, file taxes, obtain business licenses, and more—and this is what gives you liability protection.",
              title2: "How easy is it to form an LLC?",
              text2:
                "You may be a little intimidated by the idea of forming a Orizen entity like an LLC, especially if it's your first time. All you need is an understanding of what your business will do, how you plan to run it, and your state's LLC filing fees. Even if your business requires a retail location, you don't need a physical address lined up to begin your LLC formation.",
              img: "/hero.webp",
            },
          ].map((item, index) => (
            <div
              key={index}
              className={`bg-white rounded-2xl shadow-md px-12 py-6 mb-8 flex flex-col md:flex-row ${index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} items-center gap-12 transition-transform transform hover:scale-105 hover:shadow-xl duration-300`}
            >
              <div className="w-full md:w-1/2 space-y-6">
                <div>
                  <h3 className="text-[26px] font-normal mb-4 text-gray-900" style={{ fontFamily: 'Montserrat' }}>{item.title1}</h3>
                  <p className="text-gray-700 text-[15px] font-normal leading-relaxed" style={{ fontFamily: 'Nethead' }}>{item.text1}</p>
                </div>
                <div>
                  <h3 className="text-[26px] font-normal mb-4 text-gray-900" style={{ fontFamily: 'Montserrat' }}>{item.title2}</h3>
                  <p className="text-gray-700 text-[15px] font-normal leading-relaxed" style={{ fontFamily: 'Nethead' }}>{item.text2}</p>
                </div>
              </div>
              <div className="w-full md:w-1/2 flex justify-center">
                <Image
                  src={item.img || "/placeholder.svg"}
                  alt="Business owners"
                  width={500}
                  height={300}
                  className="rounded-xl object-cover"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </ScrollAnimation>
  );
}
