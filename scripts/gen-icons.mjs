import sharp from 'sharp'
import { mkdirSync } from 'fs'
import { join } from 'path'

const resDir = join(process.cwd(), 'android', 'app', 'src', 'main', 'res')

const sizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
}

const svgSimple = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size*0.15}" fill="#1a1d23"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size*0.4}" fill="#2c3040"/>
  <text x="${size/2}" y="${size*0.56}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="800" font-size="${size*0.28}" fill="#e8e8e8">MS</text>
</svg>`

const svgRound = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <clipPath id="c"><circle cx="${size/2}" cy="${size/2}" r="${size/2}"/></clipPath>
  </defs>
  <g clip-path="url(#c)">
    <rect width="${size}" height="${size}" fill="#1a1d23"/>
    <circle cx="${size/2}" cy="${size/2}" r="${size*0.4}" fill="#2c3040"/>
    <text x="${size/2}" y="${size*0.56}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="800" font-size="${size*0.28}" fill="#e8e8e8">MS</text>
  </g>
</svg>`

async function generate() {
  for (const [folder, size] of Object.entries(sizes)) {
    const dir = join(resDir, folder)
    mkdirSync(dir, { recursive: true })

    await sharp(Buffer.from(svgSimple(size))).png().toFile(join(dir, 'ic_launcher.png'))
    await sharp(Buffer.from(svgRound(size))).png().toFile(join(dir, 'ic_launcher_round.png'))
    console.log(`${folder}: ${size}x${size} ✓`)
  }

  console.log('All icons generated!')
}

generate().catch(console.error)
