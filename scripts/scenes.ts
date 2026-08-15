/**
 * Scene artwork intake.
 *
 *   npm run scenes
 *
 * Scans public/scenes/ for images named after a scene id (fishing.png,
 * night-market.jpg, ...), converts anything that is not already an optimised
 * JPEG to one at 1200px wide, and rewrites the scenesWithPhotos list in
 * lib/camcue/data/scene-photos.ts to match exactly what is on disk.
 *
 * Drop a PNG in, run it, done. The list can never point at a missing file
 * because it is regenerated from the folder every time.
 */

import { readdirSync, existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync, statSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { scenes } from "../lib/camcue/data/scenes";

const DIR = join(process.cwd(), "public", "scenes");
const MANIFEST = join(process.cwd(), "lib", "camcue", "data", "scene-photos.ts");
const WIDTH = 1200;
const QUALITY = 80;

const sceneIds = new Set(scenes.map((scene) => scene.id));

async function main() {
  if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true });

  const files = readdirSync(DIR).filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
  const ready: string[] = [];
  const unknown: string[] = [];

  for (const file of files) {
    const id = file.replace(/\.(png|jpe?g|webp)$/i, "");
    if (!sceneIds.has(id)) {
      unknown.push(file);
      continue;
    }

    const src = join(DIR, file);
    const out = join(DIR, `${id}.jpg`);
    const isConverted = /\.jpg$/i.test(file) && statSync(src).size < 500 * 1024;

    if (!isConverted) {
      // Read into memory first: sharp cannot write over its own input file.
      const buffer = readFileSync(src);
      const before = buffer.length;
      await sharp(buffer).resize(WIDTH, undefined, { withoutEnlargement: true }).jpeg({ quality: QUALITY, mozjpeg: true }).toFile(out);
      if (src !== out) unlinkSync(src);
      const after = statSync(out).size;
      console.log(`  ${id}: ${(before / 1024).toFixed(0)}KB -> ${(after / 1024).toFixed(0)}KB`);
    }
    ready.push(id);
  }

  ready.sort();

  const manifest = readFileSync(MANIFEST, "utf8");
  const list = ready.map((id) => `  "${id}",`).join("\n");
  const block = `// scenes:begin\nexport const scenesWithPhotos: string[] = [\n${list}\n];\n// scenes:end`;
  const emptyBlock = `// scenes:begin\nexport const scenesWithPhotos: string[] = [];\n// scenes:end`;
  const next = manifest.replace(/\/\/ scenes:begin[\s\S]*?\/\/ scenes:end/, ready.length ? block : emptyBlock);
  writeFileSync(MANIFEST, next);

  console.log(`\n${ready.length} scene image${ready.length === 1 ? "" : "s"} live: ${ready.join(", ") || "none"}`);
  if (unknown.length) {
    console.log(`\nIgnored (filename is not a scene id): ${unknown.join(", ")}`);
    console.log(`Scene ids live in lib/camcue/data/scenes.ts — e.g. fishing, night-market, talking-head, cinematic.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
