"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

interface TemplateUnlockNotificationProps {
  templateName: string
  onComplete?: () => void
}

export function TemplateUnlockNotification({ templateName, onComplete }: TemplateUnlockNotificationProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          if (onComplete) {
            setTimeout(() => {
              onComplete()
            }, 500)
          }
          return 100
        }
        return prev + 2
      })
    }, 100)

    return () => clearInterval(interval)
  }, [onComplete])

  return (
    <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4 text-sm">
      <p className="text-green-800 mb-2">
        Payment approved. <span className="font-medium">{templateName}</span> is being unlocked
      </p>
      <div className="h-1.5 w-full bg-green-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-green-500 rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: `${progress}%` }}
          transition={{ ease: "easeInOut" }}
        />
      </div>
    </div>
  )
}

