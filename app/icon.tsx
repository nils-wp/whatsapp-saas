import { ImageResponse } from 'next/og'
import { readFile } from 'fs/promises'
import { join } from 'path'

export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

export default async function Icon() {
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
          background: 'transparent',
        }}
      >
        <img
          src={logoBase64}
          width="32"
          height="32"
          style={{ objectFit: 'contain' }}
        />
      </div>
    ),
    {
      ...size,
    }
  )
}
