import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Star, Phone } from 'lucide-react'
import { ScrollAnimation } from "./GlobalScrollAnimation";


export default function Hero() {
  return (
    <ScrollAnimation>
    <div className="bg-[#FAF8F6] py-6 md:py-10 px-[5%]">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          
          {/* Left Section - Text & Trustpilot */}
          <div>
            <h1 className="text-4xl md:text-5xl font-serif font-semibold mb-5 leading-tight text-gray-900">
              Start your LLC <br />
              with <span className="italic font-bold">confidence</span>
            </h1>
            <p className="text-gray-700 text-lg mb-5 leading-relaxed">
              Whether you're ready to form an LLC on your own or want advice every step of the way we&apos;ve got your back.
            </p>

            {/* Contact Info */}
            <div className="mb-6">
              <p className="flex items-center text-gray-800 font-medium text-lg">
                <Phone className="h-5 w-5 mr-2 text-gray-700" />
Have questions? Call <span className="font-bold ml-1">(833) 799-4891 </span> to speak with a business specialist.
              </p>
            </div>

            {/* Trustpilot Rating */}
            <div className="flex items-center gap-4">
              <div className="text-xl font-semibold text-gray-800">Excellent</div>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((_, i) => (
                  <Star key={i} className="w-6 h-6 text-[#00b67a]" />
                ))}
              </div>
              <span className="text-lg text-gray-600 font-medium">Trustpilot</span>
            </div>
          </div>

          {/* Right Section - Image & Testimonial */}
          <div className="relative h-[400px] md:h-[450px] rounded-xl overflow-hidden shadow-lg">
            <Image
              src="/hero.webp"
              alt="Business Confidence"
              fill 
  style={{ objectFit: 'cover' }} 
              className="rounded-xl"
            />
            
            {/* Testimonial Card */}
            <div className="bg-white p-6 rounded-2xl shadow-lg absolute right-6 bottom-6 max-w-sm">
              <p className="text-gray-800 text-lg italic leading-relaxed">
                Orizen was an incredible partner. My business feels so sound that I can&apos;t wait to hire more people...
                and have Orizen there with me as I grow.
              </p>
              <div className="mt-4">
                <p className="font-semibold text-gray-900">Shannon Greevy</p>
                <p className="text-sm text-gray-600">LLC customer</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Buttons Section */}
      <div className="container mx-auto mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button variant="secondary" className="py-5 text-lg rounded-xl bg-gray-100 hover:bg-gray-200 shadow-md">
            I can do most of the work myself
          </Button>
          <Button variant="default" className="py-5 text-lg rounded-xl bg-[#2D4356] hover:bg-[#435B66] shadow-md text-white">
            I want advice from experienced attorneys
          </Button>
        </div>
      </div>
    </div>
    </ScrollAnimation>
  )
}
