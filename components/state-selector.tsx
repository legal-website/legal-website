"use client"

import Image from "next/image"
import { ScrollAnimation } from "./GlobalScrollAnimation"

const states = [
  "Florida",
  "Wyoming",
  "Montana",
  "New Mexico",
  "New York",
  "Texas",
  "Virginia",
  "Georgia",
  "Illinois",
  "Delaware",
  "California",
  "Washington",
]

export default function StateSelector() {
  return (
    <ScrollAnimation>
      <section className="py-8 sm:py-12 md:py-16 bg-gray-100 overflow-x-hidden">
        <div
          id="states"
          className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-md py-6 sm:py-8 md:py-12"
        >
          <h2 className="text-2xl sm:text-2xl md:text-3xl font-serif text-center mb-2 sm:mb-3 md:mb-4">
            Find the right state to form an LLC
          </h2>
          <p className="text-sm sm:text-base text-center text-gray-600 mb-6 sm:mb-8 md:mb-10">
            Every state has different rules, costs, and considerations for LLC formation.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {states.map((state) => (
              <div
                key={state}
                className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 md:p-5 border rounded-lg bg-gray-50 cursor-pointer 
              transition-all duration-300 ease-in-out 
              hover:border-[#22c984] hover:shadow-lg hover:scale-105 group"
              >
                {/* Icon (No Hover Effect) */}
                <div className="relative w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex-shrink-0">
                  <Image src="/usa.svg" alt="Map icon" fill className="object-contain" />
                </div>
                <div>
                  {/* State Name */}
                  <div className="font-medium text-sm sm:text-base text-gray-800 transition-colors duration-300 group-hover:text-[#1eac73]">
                    {state}
                  </div>
                  {/* LLC Text with Hover Effect */}
                  <div className="text-xs sm:text-sm text-gray-600 transition-colors duration-300 group-hover:text-black">
                    LLC
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </ScrollAnimation>
  )
}

