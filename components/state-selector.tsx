"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"
import { ScrollAnimation } from "./GlobalScrollAnimation";


const states = [
  ["Alabama", "Alaska", "Arizona"],
  ["Arkansas", "California", "Colorado"],
  ["Connecticut", "Delaware", "Florida"],
  ["Georgia", "Hawaii", "Idaho"],
  ["Illinois", "Indiana", "Iowa"],
  ["Kansas", "Kentucky", "Louisiana"],
  ["Maine", "Maryland", "Massachusetts"],
  ["Michigan", "Minnesota", "Mississippi"],
  ["Missouri", "Montana", "Nebraska"],
  ["Nevada", "New Hampshire", "New Jersey"],
  ["New Mexico", "New York", "North Carolina"],
  ["North Dakota", "Ohio", "Oklahoma"],
  ["Oregon", "Pennsylvania", "Rhode Island"],
  ["South Carolina", "South Dakota", "Tennessee"],
  ["Texas", "Utah", "Vermont"],
  ["Virginia", "Washington", "West Virginia"],
  ["Wisconsin", "Wyoming"],
]

export default function StateSelector() {
  const [showAll, setShowAll] = useState(false)
  const displayedStates = showAll ? states : states.slice(0, 4)

  return (
    <ScrollAnimation>
    <section className="py-16 bg-gray-100">
      <div id= "states" className="max-w-3xl mx-auto px-4 md:px-[5%] bg-white rounded-2xl shadow-md py-12">
        <h2 className="text-3xl font-serif text-center mb-4">
          Find the right state to form an LLC
        </h2>
        <p className="text-center text-gray-600 mb-12">
          Every state has different rules, costs, and considerations for LLC formation.
        </p>

        <div className="space-y-6">
          {displayedStates.map((row, rowIndex) => (
            <div key={rowIndex} className="grid md:grid-cols-3 gap-6">
              {row.map((state) => (
                <div
                  key={state}
                  className="flex items-center gap-4 p-5 border rounded-lg bg-gray-50 cursor-pointer 
                  transition-all duration-300 ease-in-out 
                  hover:border-[#22c984] hover:shadow-lg hover:scale-105 group"
                >
                  {/* Icon (No Hover Effect) */}
                  <div className="relative w-8 h-8">
                    <Image
                      src="/usa.svg"
                      alt="Map icon"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div>
                    {/* State Name */}
                    <div className="font-medium text-gray-800 transition-colors duration-300 group-hover:text-[#1eac73]">
                      {state}
                    </div>
                    {/* LLC Text with Hover Effect */}
                    <div className="text-sm text-gray-600 transition-colors duration-300 group-hover:text-black">
                      LLC
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-8">
          <Button
            variant="ghost"
            onClick={() => setShowAll(!showAll)}
            className="text-[#22c984] hover:text-[#1eac73]"
          >
            {showAll ? (
              <>
                <ChevronUp className="w-4 h-4 mr-2" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                Show all states
              </>
            )}
          </Button>
        </div>
      </div>
    </section>
    </ScrollAnimation>
  )
}
