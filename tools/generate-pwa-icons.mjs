import sharp from 'sharp';
import fs from 'node:fs';

const src = 'public/assets/branding/aegis-emblem-v1.png';
fs.mkdirSync('public/icons', { recursive: true });
fs.mkdirSync('public/screenshots', { recursive: true });

async function main() {
  const base = sharp(src);
  const meta = await base.metadata();
  console.log('source', meta.width, meta.height);

  await sharp(src).resize(192, 192, { fit: 'contain', background: { r: 10, g: 14, b: 18, alpha: 1 } }).png().toFile('public/icons/icon-192.png');
  await sharp(src).resize(512, 512, { fit: 'contain', background: { r: 10, g: 14, b: 18, alpha: 1 } }).png().toFile('public/icons/icon-512.png');
  // maskable: emblem at ~80% with full-bleed bg per maskable safe zone
  const inner = await sharp(src).resize(400, 400, { fit: 'contain', background: { r: 10, g: 14, b: 18, alpha: 1 } }).png().toBuffer();
  await sharp({ create: { width: 512, height: 512, channels: 4, background: { r: 10, g: 14, b: 18, alpha: 1 } } })
    .composite([{ input: inner, left: 56, top: 56 }]).png().toFile('public/icons/maskable-512.png');
  await sharp(src).resize(180, 180, { fit: 'cover' }).png().toFile('public/icons/apple-touch-icon-180.png');
  await sharp(src).resize(32, 32, { fit: 'contain', background: { r: 10, g: 14, b: 18, alpha: 1 } }).png().toFile('public/icons/favicon-32.png');

  // screenshots: themed backdrops with emblem centered + title bar
  const mkShot = async (w, h, out) => {
    const size = Math.min(Math.floor(w * 0.4), Math.floor(h * 0.5));
    const emblem = await sharp(src).resize(size, size, { fit: 'contain', background: { r: 10, g: 14, b: 18, alpha: 0 } }).png().toBuffer();
    const svg = Buffer.from(`<svg width="${w}" height="${h}"><rect width="100%" height="100%" fill="#0A0E12"/><rect x="0" y="0" width="${w}" height="72" fill="#121920"/><text x="${w/2}" y="46" font-family="Georgia,serif" font-size="30" fill="#D7AA4E" text-anchor="middle">AEGIS OF THE BORDERKEEP</text></svg>`);
    const bg = await sharp({ create: { width: w, height: h, channels: 4, background: { r: 10, g: 14, b: 18, alpha: 1 } } })
      .composite([{ input: svg, left: 0, top: 0 }, { input: emblem, left: Math.floor((w-size)/2), top: Math.floor((h-size)/2) + 20 }])
      .png().toFile(out);
    return bg;
  };
  await mkShot(1280, 720, 'public/screenshots/desktop-1280x720.png');
  await mkShot(540, 720, 'public/screenshots/mobile-540x720.png');
  for (const f of ['public/icons/icon-192.png','public/icons/icon-512.png','public/icons/maskable-512.png','public/icons/apple-touch-icon-180.png','public/icons/favicon-32.png','public/screenshots/desktop-1280x720.png','public/screenshots/mobile-540x720.png']) {
    console.log(f, fs.statSync(f).size);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
