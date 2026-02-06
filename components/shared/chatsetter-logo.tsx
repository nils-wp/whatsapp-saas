'use client'

import { cn } from '@/lib/utils'

interface ChatsetterLogoProps {
  className?: string
  size?: number
  showText?: boolean
}

export function ChatsetterLogo({ className, size = 32, showText = false }: ChatsetterLogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <ChatsetterIcon size={size} />
      {showText && (
        <span
          className="font-semibold text-white tracking-tight"
          style={{ fontSize: size * 0.55 }}
        >
          Chatsetter
        </span>
      )}
    </div>
  )
}

/**
 * Inline SVG icon - no external image loading
 */
export function ChatsetterIcon({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background circle with gradient */}
      <defs>
        <linearGradient id="chatsetterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#chatsetterGrad)" />

      {/* Chat bubble icon */}
      <path
        d="M14 16C14 14.8954 14.8954 14 16 14H32C33.1046 14 34 14.8954 34 16V28C34 29.1046 33.1046 30 32 30H22L17 34V30H16C14.8954 30 14 29.1046 14 28V16Z"
        fill="white"
        fillOpacity="0.95"
      />

      {/* Three dots for typing indicator */}
      <circle cx="20" cy="22" r="2" fill="#10b981" />
      <circle cx="26" cy="22" r="2" fill="#10b981" fillOpacity="0.7" />
      <circle cx="32" cy="22" r="2" fill="#10b981" fillOpacity="0.4" />
    </svg>
  )
}
