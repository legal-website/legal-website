import { Disclosure } from "@headlessui/react"
import { ChevronUpIcon } from "@heroicons/react/20/solid"

const faqs = [
  {
    question: "How can I update my personal information?",
    answer:
      "You can update your personal information by logging into your account and navigating to the 'Profile' section. There, you'll find options to edit your details.",
  },
  {
    question: "What should I do if I suspect unauthorized access to my account?",
    answer:
      "If you suspect unauthorized access, immediately change your password and contact our support team. We'll help you secure your account and investigate any potential issues.",
  },
  {
    question: "How long do you retain my data?",
    answer:
      "We retain your data for as long as your account is active or as needed to provide you services. If you close your account, we will delete or anonymize your data within a reasonable timeframe, unless required to retain it by law.",
  },
]

export default function FAQSection() {
  return (
    <div className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-8">Frequently Asked Questions</h2>
        <div className="max-w-3xl mx-auto divide-y-2 divide-gray-200">
          {faqs.map((faq) => (
            <Disclosure as="div" key={faq.question} className="pt-6">
              {({ open }) => (
                <>
                  <dt className="text-lg">
                    <Disclosure.Button className="text-left w-full flex justify-between items-start text-gray-400">
                      <span className="font-medium text-gray-900">{faq.question}</span>
                      <span className="ml-6 h-7 flex items-center">
                        <ChevronUpIcon
                          className={`${open ? "-rotate-180" : "rotate-0"} h-6 w-6 transform`}
                          aria-hidden="true"
                        />
                      </span>
                    </Disclosure.Button>
                  </dt>
                  <Disclosure.Panel as="dd" className="mt-2 pr-12">
                    <p className="text-base text-gray-500">{faq.answer}</p>
                  </Disclosure.Panel>
                </>
              )}
            </Disclosure>
          ))}
        </div>
      </div>
    </div>
  )
}

