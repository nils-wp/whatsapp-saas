import { ImageResponse } from 'next/og'

export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Main body - speech bubble pointing down */}
          <path
            d="M30 20 L70 20 Q85 20 85 35 L85 55 Q85 65 75 65 L55 65 L50 85 L45 65 L25 65 Q15 65 15 55 L15 35 Q15 20 30 20 Z"
            fill="#14b8a6"
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
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
