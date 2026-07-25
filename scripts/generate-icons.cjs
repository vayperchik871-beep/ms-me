const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SRC = 'C:\\Users\\ARSIK\\Pictures\\5415959966943746139_119.svg';
const RES_DIR = 'D:\\петка\\android\\app\\src\\main\\res';
const PUBLIC_DIR = 'D:\\петка\\public';

const ICON_SIZES = [
  { dir: 'mipmap-mdpi', size: 48 },
  { dir: 'mipmap-hdpi', size: 72 },
  { dir: 'mipmap-xhdpi', size: 96 },
  { dir: 'mipmap-xxhdpi', size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 },
];

async function main() {
  // 1. Copy to public/
  await sharp(SRC)
    .resize(256, 256)
    .png()
    .toFile(path.join(PUBLIC_DIR, 'app-icon.png'));
  console.log('public/app-icon.png');

  // 2. Generate mipmap icons (both ic_launcher.png and ic_launcher_round.png)
  for (const { dir, size } of ICON_SIZES) {
    const d = path.join(RES_DIR, dir);
    const buf = await sharp(SRC)
      .resize(size, size)
      .png()
      .toBuffer();
    fs.writeFileSync(path.join(d, 'ic_launcher.png'), buf);
    fs.writeFileSync(path.join(d, 'ic_launcher_round.png'), buf);
    console.log(`${dir}/ic_launcher.png (${size}x${size})`);
  }

  // 3. Adaptive icon foreground (432x432 as existing)
  const fgBuf = await sharp(SRC)
    .resize(432, 432)
    .png()
    .toBuffer();
  const drawable = path.join(RES_DIR, 'drawable');
  const drawableV24 = path.join(RES_DIR, 'drawable-v24');
  fs.writeFileSync(path.join(drawable, 'ic_launcher_foreground.png'), fgBuf);
  fs.writeFileSync(path.join(drawableV24, 'ic_launcher_foreground.png'), fgBuf);
  console.log('drawable/ic_launcher_foreground.png (432x432)');

  // 4. Adaptive icon background — extract dominant color
  const stats = await sharp(SRC).resize(1, 1).raw().toBuffer();
  const r = stats[0], g = stats[1], b = stats[2];
  const bgBuf = await sharp({
    create: { width: 432, height: 432, channels: 4, background: { r, g, b, alpha: 1 } }
  }).png().toBuffer();
  fs.writeFileSync(path.join(drawable, 'ic_launcher_background.png'), bgBuf);
  console.log(`drawable/ic_launcher_background.png (432x432, color rgb(${r},${g},${b}))`);

  // 5. Splash screen
  const splashBuf = await sharp(SRC)
    .resize(480, 320, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(drawable, 'splash.png'), splashBuf);
  console.log('drawable/splash.png (480x320)');
}

main().catch(console.error);
