'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

interface ChatsetterLogoProps {
  className?: string
  size?: number
  showText?: boolean
}

export function ChatsetterLogo({ className, size = 40, showText = false }: ChatsetterLogoProps) {
  if (showText) {
    // Use the full logo with text
    // Original image is 1440x1024, aspect ratio ~1.41
    const width = size * 3.5
    const height = size * 2.5
    return (
      <div className={cn("flex items-center", className)}>
        <Image
          src="/logo-full.png"
          alt="ChatSetter.io"
          width={width}
          height={height}
          className="object-contain"
          priority
        />
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <ChatsetterIcon size={size} />
    </div>
  )
}

/**
 * Icon-only version for favicon/small displays
 */
export function ChatsetterIcon({ size = 32 }: { size?: number }) {
  return (
    <Image
      src="/logo-icon.png"
      alt="ChatSetter"
      width={size}
      height={size}
      className="object-contain"
      priority
    />
  )
}
