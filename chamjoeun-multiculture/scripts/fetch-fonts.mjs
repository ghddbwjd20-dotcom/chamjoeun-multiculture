import { writeFile } from "node:fs/promises";
const fonts = [
  [
    "PretendardVariable.woff2",
    "https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/web/variable/woff2/PretendardVariable.woff2",
  ],
  [
    "NanumMyeongjo-Regular.ttf",
    "https://raw.githubusercontent.com/google/fonts/main/ofl/nanummyeongjo/NanumMyeongjo-Regular.ttf",
  ],
  [
    "NanumMyeongjo-OFL.txt",
    "https://raw.githubusercontent.com/google/fonts/main/ofl/nanummyeongjo/OFL.txt",
  ],
];
for (const [name, url] of fonts) {
  const r = await fetch(url);
  if (!r.ok) {
    console.log(`Unavailable ${name}: ${r.status}`);
    continue;
  }
  await writeFile(`public/fonts/${name}`, Buffer.from(await r.arrayBuffer()));
  console.log(`Saved ${name}`);
}
