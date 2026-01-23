'use client'

import { cn } from '@/lib/utils'

interface ChatsetterLogoProps {
  className?: string
  size?: number
  showText?: boolean
}

export function ChatsetterLogo({ className, size = 40, showText = false }: ChatsetterLogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <ChatsetterIcon size={size} />
      {showText && (
        <div className="flex flex-col">
          <span className="font-bold text-[#e9edef] text-base leading-tight">
            ChatSetter<span className="text-[#14b8a6]">.io</span>
          </span>
          <span className="text-xs text-[#8696a0]">AI Appointment Setter</span>
        </div>
      )}
    </div>
  )
}

/**
 * Icon-only version for favicon/small displays
 * Teal robot chatbot with speech bubbles
 */
export function ChatsetterIcon({ size = 32 }: { size?: number }) {
  const id = `gradient-${Math.random().toString(36).slice(2, 9)}`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Chat bubble top-left */}
      <ellipse
        cx="20"
        cy="25"
        rx="15"
        ry="12"
        fill="none"
        stroke="#0d9488"
        strokeWidth="2.5"
      />
      <circle cx="14" cy="32" r="2.5" fill="#0d9488" />

      {/* Chat bubble bottom-right */}
      <ellipse
        cx="80"
        cy="75"
        rx="15"
        ry="12"
        fill="none"
        stroke="#0d9488"
        strokeWidth="2.5"
      />
      <circle cx="86" cy="82" r="2.5" fill="#0d9488" />

      {/* Main body - speech bubble pointing down */}
      <path
        d="M30 20 L70 20 Q85 20 85 35 L85 55 Q85 65 75 65 L55 65 L50 85 L45 65 L25 65 Q15 65 15 55 L15 35 Q15 20 30 20 Z"
        fill={`url(#${id})`}
      />

      {/* Robot face mask - rounded rectangle */}
      <rect
        x="28"
        y="35"
        width="44"
        height="20"
        rx="10"
        fill="white"
      />

      {/* Left eye */}
      <circle cx="40" cy="45" r="5" fill="#22d3ee" />

      {/* Right eye */}
      <circle cx="60" cy="45" r="5" fill="#22d3ee" />

      {/* Gradient definition */}
      <defs>
        <linearGradient id={id} x1="15" y1="20" x2="85" y2="85" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2dd4bf" />
          <stop offset="50%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>
      </defs>
    </svg>
  )
}
