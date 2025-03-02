"use client"

import type React from "react"
import { useEffect } from "react"
import { motion, useAnimation, type Variant } from "framer-motion"
import { useInView } from "react-intersection-observer"

interface ScrollAnimationProps {
  children: React.ReactNode
  direction?: "left" | "right" | "up" | "down"
}

const variants: Record<string, Variant> = {
  hidden: (direction: string) => {
    return {
      x: direction === "left" ? -100 : direction === "right" ? 100 : 0,
      y: direction === "up" ? 100 : direction === "down" ? -100 : 0,
      opacity: 0,
    }
  },
  visible: {
    x: 0,
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: "easeOut",
    },
  },
}

export const ScrollAnimation: React.FC<ScrollAnimationProps> = ({ children, direction = "up" }) => {
  const controls = useAnimation()
  const [ref, inView] = useInView({
    threshold: 0.2,
    triggerOnce: true,
  })

  useEffect(() => {
    if (inView) {
      controls.start("visible")
    }
  }, [controls, inView])

  return (
    <motion.div ref={ref} animate={controls} initial="hidden" variants={variants} custom={direction}>
      {children}
    </motion.div>
  )
}