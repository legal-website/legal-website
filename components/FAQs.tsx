"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface FAQItem {
  question: string
  answer: string
}

const faqs: FAQItem[] = [
  {
    question: "What is an LLC?",
    answer:
      "An LLC (Limited Liability Company) is a business structure that combines the pass-through taxation of a partnership or sole proprietorship with the limited liability of a corporation, protecting your personal assets from business debts and liabilities.",
  },
  {
    question: "How long does it take to form an LLC?",
    answer:
      "The time to form an LLC varies by state, typically ranging from 1-3 weeks. With our expedited service, we can often complete the process in just 3-5 business days in many states.",
  },
  {
    question: "What are the benefits of forming an LLC?",
    answer:
      "Benefits include personal liability protection, tax flexibility, less paperwork than corporations, management flexibility, and enhanced credibility with customers and partners.",
  },
  {
    question: "Do I need a lawyer to form an LLC?",
    answer:
      "No, you don't need a lawyer to form an LLC. Our platform provides all the necessary tools and guidance to complete the LLC formation process without legal assistance, saving you time and money.",
  },
  {
    question: "What ongoing requirements does an LLC have?",
    answer:
      "LLCs typically need to file annual reports, pay annual fees, maintain a registered agent, keep business and personal finances separate, and file appropriate tax returns. Requirements vary by state.",
  },
  {
    question: "Can I convert my existing business to an LLC?",
    answer:
      "Yes, sole proprietorships, partnerships, and corporations can convert to an LLC. The process varies by state and business type, but our platform can guide you through the conversion process.",
  },
]

export default function FAQs() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index)
  }

  return (
    <section className="py-8 sm:py-12 px-4 w-full max-w-3xl mx-auto overflow-hidden block md:hidden">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-3xl sm:text-4xl font-bold mb-1 sm:mb-2">FAQ</h2>
        <p className="text-gray-500 text-sm sm:text-base">Frequently asked questions</p>
      </div>

      <div className="space-y-3 sm:space-y-4 bg-white rounded-lg shadow-lg p-4 sm:p-6 w-full">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className={`border-b border-gray-100 last:border-b-0 transition-all duration-300 ${
              activeIndex === index ? "shadow-md border border-[#20BD7D] rounded-lg mx-0 px-2 py-1 my-2 sm:my-4" : ""
            }`}
          >
            <button
              className="py-3 sm:py-4 w-full flex justify-between items-center text-left focus:outline-none"
              onClick={() => toggleFAQ(index)}
              aria-expanded={activeIndex === index}
            >
              <span className="font-medium text-gray-900 text-sm sm:text-base pr-2">{faq.question}</span>
              <ChevronDown
                className={`flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 text-gray-500 transition-transform duration-300 ${
                  activeIndex === index ? "transform rotate-180 text-[#20BD7D]" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {activeIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="pb-3 sm:pb-4 text-gray-600 text-sm sm:text-base">{faq.answer}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </section>
  )
}

