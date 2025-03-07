import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"
import Link from "next/link"

export default function ThankYouPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 mb-44">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg text-center">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-green-100 p-3">
            <CheckCircle className="h-12 w-12 text-[#22c984]" />
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-4">Thank You!</h1>

        <p className="text-gray-600 mb-8">
          Your LLC formation order has been successfully placed. We'll begin processing your order right away.
        </p>

        <div className="bg-gray-50 p-4 rounded-lg mb-8">
          <h2 className="font-semibold mb-2">What happens next?</h2>
          <ul className="text-left text-sm space-y-2">
            <li className="flex items-start">
              <span className="text-[#22c984] mr-2">1.</span>
              <span>You'll receive a confirmation email with your order details.</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#22c984] mr-2">2.</span>
              <span>Our team will prepare and file your LLC formation documents.</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#22c984] mr-2">3.</span>
              <span>You'll receive updates on your order status via email.</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#22c984] mr-2">4.</span>
              <span>Once approved, you'll receive your LLC formation documents.</span>
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <Link href="/">
            <Button className="w-full bg-[#22c984] hover:bg-[#1eac73] text-white">Return to Home</Button>
          </Link>

          <Link href="/dashboard">
            <Button variant="outline" className="w-full">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

