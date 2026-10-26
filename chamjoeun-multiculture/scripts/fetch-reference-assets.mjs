import { mkdir, writeFile } from "node:fs/promises";
const photos = [
  [
    "learning-space.jpg",
    "https://images.unsplash.com/photo-1564910443496-5fd2d76b47fa?fm=jpg&w=1800&q=85",
  ],
  [
    "study-detail.jpg",
    "https://images.unsplash.com/photo-1679119790850-161688b0417e?fm=jpg&w=1600&q=85",
  ],
  [
    "consultation-space.jpg",
    "https://images.unsplash.com/photo-1591970669426-0143eb662b78?fm=jpg&w=1800&q=85",
  ],
  [
    "library-shelves.jpg",
    "https://images.unsplash.com/photo-1507738978512-35798112892c?fm=jpg&w=1800&q=85",
  ],
];
await mkdir("public/fonts", { recursive: true });
for (const [name, url] of photos) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Photo download failed: ${name} ${r.status}`);
  await writeFile(`public/images/${name}`, Buffer.from(await r.arrayBuffer()));
  console.log(`Saved ${name}`);
}
const fonts = [
  [
    "PretendardVariable.woff2",
    "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/woff2/PretendardVariable.woff2",
  ],
  [
    "NanumMyeongjo-Regular.ttf",
    "https://raw.githubusercontent.com/google/fonts/main/ofl/nanummyeongjo/NanumMyeongjo-Regular.ttf",
  ],
  [
    "NanumMyeongjo-OFL.txt",
    "https://raw.githubusercontent.com/google/fonts/main/ofl/nanummyeongjo/OFL.txt",
  ],
  [
    "Pretendard-LICENSE.txt",
    "https://raw.githubusercontent.com/orioncactus/pretendard/main/LICENSE",
  ],
];
for (const [name, url] of fonts) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Font download failed: ${name} ${r.status}`);
  await writeFile(`public/fonts/${name}`, Buffer.from(await r.arrayBuffer()));
  console.log(`Saved ${name}`);
}
