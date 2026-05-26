/** Premium easing — soft, cinematic (COS / Aesop style) */
export const luxuryEase = [0.22, 1, 0.36, 1] as const

export const transition = {
  fast: { duration: 0.35, ease: luxuryEase },
  base: { duration: 0.5, ease: luxuryEase },
  slow: { duration: 0.65, ease: luxuryEase },
  slower: { duration: 0.75, ease: luxuryEase },
} as const

export const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: transition.slow,
  },
}

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: transition.slow,
  },
}

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.06,
    },
  },
}

export const pageTransition = {
  initial: { opacity: 0, y: 6 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: luxuryEase },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.4, ease: luxuryEase },
  },
}
