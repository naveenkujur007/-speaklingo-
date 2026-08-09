// Generate PWA icons from the SVG source.
// Outputs: icon-192.png, icon-256.png, icon-384.png, icon-512.png,
// apple-touch-icon.png (180x180), favicon-32.png, favicon-16.png
import sharp from "sharp";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const svgPath = resolve(projectRoot, "public", "icon.svg");
const publicDir = resolve(projectRoot, "public");

const svgBuffer = readFileSync(svgPath);

const sizes = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-256.png", size: 256 },
  { name: "icon-384.png", size: 384 },
  { name: "icon-512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
  { name: "favicon-32.png", size: 32 },
  { name: "favicon-16.png", size: 16 },
  { name: "icon-maskable-512.png", size: 512, maskable: true },
];

async function generate() {
  for (const { name, size, maskable } of sizes) {
    const outPath = resolve(publicDir, name);

    if (maskable) {
      // For maskable icons, the safe zone is the inner 80%. We composite
      // the SVG onto a solid emerald background so the maskable padding
      // is filled with brand color (no transparent edges when the OS
      // crops to a circle/squircle).
      const inner = Math.round(size * 0.8);
      const offset = Math.round((size - inner) / 2);
      const innerPng = await sharp(svgBuffer, { density: 384 })
        .resize(inner, inner, { fit: "contain" })
        .png()
        .toBuffer();
      await sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: { r: 16, g: 185, b: 129, alpha: 1 },
        },
      })
        .composite([{ input: innerPng, left: offset, top: offset }])
        .png()
        .toFile(outPath);
    } else {
      await sharp(svgBuffer, { density: 384 })
        .resize(size, size, { fit: "contain" })
        .png()
        .toFile(outPath);
    }
    console.log(`✓ ${name} (${size}x${size}${maskable ? " maskable" : ""})`);
  }
  console.log("All icons generated.");
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
