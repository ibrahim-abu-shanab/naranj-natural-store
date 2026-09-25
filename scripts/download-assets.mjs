import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";
await mkdir("public/images", { recursive: true });
const sources = {
  oil: "https://images.unsplash.com/photo-1608571424266-edeb9bbefdec?w=1000&q=85&fm=jpg",
  serum:
    "https://images.unsplash.com/photo-1608571423539-e951b9b3871e?w=1000&q=85&fm=jpg",
  "oil-detail":
    "https://images.unsplash.com/photo-1608571424634-58ae03e6edcf?w=1000&q=85&fm=jpg",
  botanical:
    "https://images.unsplash.com/photo-1757863798018-7882cfc0b5f2?w=1500&q=85&fm=jpg",
  hero: "https://images.unsplash.com/photo-1608571424273-aa8db837260b?w=1800&q=85&fm=jpg",
};
await Promise.all(
  Object.entries(sources).map(async ([name, url]) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${name}: ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    await writeFile(
      `public/images/${name}.webp`,
      await sharp(buffer)
        .rotate()
        .resize({
          width: name === "hero" ? 1800 : 1200,
          withoutEnlargement: true,
        })
        .webp({ quality: 82 })
        .toBuffer(),
    );
    console.log(`Saved ${name}`);
  }),
);
