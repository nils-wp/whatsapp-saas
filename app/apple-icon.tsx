import { ImageResponse } from 'next/og'

export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #111b21 0%, #0d1418 100%)',
          borderRadius: '22%',
        }}
      >
        <svg
          width="140"
          height="140"
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
