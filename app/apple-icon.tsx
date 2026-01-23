import { ImageResponse } from 'next/og'
import { readFile } from 'fs/promises'
import { join } from 'path'

export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/png'

export default async function AppleIcon() {
  // Read the actual logo file
  const logoData = await readFile(join(process.cwd(), 'public', 'logo-icon.png'))
  const logoBase64 = `data:image/png;base64,${logoData.toString('base64')}`

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
        <img
          src={logoBase64}
          width="140"
          height="140"
          style={{ objectFit: 'contain' }}
        />
      </div>
    ),
    {
      ...size,
    }
  )
}
