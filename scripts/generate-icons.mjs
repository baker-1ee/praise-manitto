import sharp from 'sharp'
import { writeFileSync } from 'fs'

// SVG: purple gradient background + envelope + heart sticker
function createIconSvg(size) {
  const s = size
  const scale = s / 512

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#7C3AED"/>
      <stop offset="50%" style="stop-color:#A855F7"/>
      <stop offset="100%" style="stop-color:#C084FC"/>
    </linearGradient>
    <linearGradient id="envGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#FFFFFF;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#F3E8FF;stop-opacity:1"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#4C1D95" flood-opacity="0.35"/>
    </filter>
    <filter id="heartShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="#7C3AED" flood-opacity="0.4"/>
    </filter>
  </defs>

  <!-- Background rounded rect -->
  <rect width="512" height="512" rx="110" fill="url(#bg)"/>

  <!-- Envelope body -->
  <g filter="url(#shadow)">
    <rect x="88" y="168" width="336" height="240" rx="20" fill="url(#envGrad)"/>
    <!-- Envelope flap (V shape) -->
    <path d="M88 188 L256 296 L424 188" fill="none" stroke="#DDD6FE" stroke-width="2"/>
    <!-- Envelope top fold -->
    <path d="M88 168 L256 284 L424 168 Q424 168 424 168 L408 168 L256 268 L104 168 Z" fill="#EDE9FE"/>
    <!-- Envelope bottom lines (decorative) -->
    <line x1="130" y1="340" x2="230" y2="340" stroke="#DDD6FE" stroke-width="8" stroke-linecap="round"/>
    <line x1="130" y1="360" x2="200" y2="360" stroke="#EDE9FE" stroke-width="8" stroke-linecap="round"/>
  </g>

  <!-- Heart sticker on envelope -->
  <g filter="url(#heartShadow)" transform="translate(256, 295)">
    <!-- Heart shape -->
    <path d="M0,-52 C15,-80 55,-80 55,-45 C55,-20 30,5 0,32 C-30,5 -55,-20 -55,-45 C-55,-80 -15,-80 0,-52 Z"
          fill="#EC4899"/>
    <!-- Heart highlight -->
    <path d="M-20,-55 C-10,-68 5,-65 5,-52" fill="none" stroke="white" stroke-width="5" stroke-linecap="round" opacity="0.6"/>
  </g>
</svg>`
}

async function generateIcon(size, filename) {
  const svg = createIconSvg(size)
  const svgBuffer = Buffer.from(svg)

  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(filename)

  console.log(`Generated: ${filename}`)
}

await generateIcon(192, 'public/icon-192x192.png')
await generateIcon(512, 'public/icon-512x512.png')
await generateIcon(180, 'public/apple-touch-icon.png')

console.log('All icons generated!')
