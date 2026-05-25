"use client"

import { motion, useReducedMotion } from "framer-motion"

import { fadeUp, luxuryEase } from "@/lib/motion"
import { cn } from "@/lib/utils"

type FadeInProps = {
  children: React.ReactNode
  className?: string
  delay?: number
  /** Animate when scrolled into view (default). Set false for immediate page-load fade. */
  inView?: boolean
}

export function FadeIn({
  children,
  className,
  delay = 0,
  inView = true,
}: FadeInProps) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return <div className={cn(className)}>{children}</div>
  }

  const motionTransition = {
    duration: 0.7,
    delay,
    ease: luxuryEase,
  }

  if (inView) {
    return (
      <motion.div
        className={cn(className)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        variants={fadeUp}
        transition={motionTransition}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <motion.div
      className={cn(className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={motionTransition}
    >
      {children}
    </motion.div>
  )
}
