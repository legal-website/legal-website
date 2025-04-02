import { EnvelopeIcon, PhoneIcon } from "@heroicons/react/24/outline"

export default function ContactSection() {
  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg mx-auto md:max-w-none md:grid md:grid-cols-2 md:gap-[30px]">
          <div className="bg-gray-50 p-8 rounded-2xl shadow-[0_4px_10px_rgba(34,197,94,0.1)] hover:bg-green-50 items-start transition-transform transform hover:scale-105 hover:shadow-xl duration-300">
            <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">Contact Support</h2>
            <div className="mt-3">
              <p className="text-lg text-gray-500">
                Have questions about our policies? Our support team is here to help.
              </p>
            </div>
            <div className="mt-9">
              <div className="flex">
                <div className="flex-shrink-0">
                  <PhoneIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                </div>
                <div className="ml-3 text-base text-gray-500">
                  <p>+1 (555) 123-4567</p>
                  <p className="mt-1">Mon-Fri 8am to 6pm PST</p>
                </div>
              </div>
              <div className="mt-6 flex">
                <div className="flex-shrink-0">
                  <EnvelopeIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                </div>
                <div className="ml-3 text-base text-gray-500">
                  <p>support@example.com</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 p-8 rounded-2xl shadow-[0_4px_10px_rgba(34,197,94,0.1)] transition-shadow hover:bg-green-50 mt-12 sm:mt-16 md:mt-0 items-start  transform hover:scale-105 hover:shadow-xl duration-300">
            <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">Legal Inquiries</h2>
            <div className="mt-3">
              <p className="text-lg text-gray-500">
                For legal questions or concerns, please reach out to our legal department.
              </p>
            </div>
            <div className="mt-9">
              <div className="flex">
                <div className="flex-shrink-0">
                  <EnvelopeIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                </div>
                <div className="ml-3 text-base text-gray-500">
                  <p>info@orizen.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

