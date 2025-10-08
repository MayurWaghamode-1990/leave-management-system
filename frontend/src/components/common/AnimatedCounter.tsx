import React, { useEffect, useState, useRef } from 'react'
import { Typography, TypographyProps } from '@mui/material'

interface AnimatedCounterProps extends Omit<TypographyProps, 'children'> {
  value: number
  duration?: number
  prefix?: string
  suffix?: string
  decimals?: number
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1000,
  prefix = '',
  suffix = '',
  decimals = 0,
  ...typographyProps
}) => {
  const [count, setCount] = useState(0)
  const countRef = useRef(0)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    startTimeRef.current = null
    const startValue = countRef.current
    const endValue = value

    const animate = (currentTime: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = currentTime
      }

      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)

      // Easing function (ease-out cubic)
      const easeProgress = 1 - Math.pow(1 - progress, 3)

      const currentCount = startValue + (endValue - startValue) * easeProgress
      setCount(currentCount)
      countRef.current = currentCount

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [value, duration])

  return (
    <Typography {...typographyProps}>
      {prefix}
      {count.toFixed(decimals)}
      {suffix}
    </Typography>
  )
}

export default AnimatedCounter
