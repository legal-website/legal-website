"use client"

import { useState } from "react"
import { ChevronDown, HelpCircle } from "lucide-react"
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

export default function FAQSection() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index)
  }

  return (
    <section id="faqs" className="hidden md:block bg-gray-50 py-10 md:py-16 px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-3">
            <HelpCircle className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold">Frequently Asked Questions</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4 w-full">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm overflow-hidden w-full">
              <div
                className="py-2.5 px-5 cursor-pointer flex justify-between items-center w-full min-h-[3.5rem]"
                onClick={() => toggleFAQ(index)}
              >
                <h3 className="font-semibold text-lg pr-3">{faq.question}</h3>
                <ChevronDown
                  className={`flex-shrink-0 w-5 h-5 transition-transform duration-300 ${
                    activeIndex === index ? "transform rotate-180" : ""
                  }`}
                />
              </div>

              <AnimatePresence>
                {activeIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="px-5 pb-5"
                  >
                    <p className="text-gray-600 text-base">{faq.answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
