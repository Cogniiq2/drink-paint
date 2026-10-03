// node scripts/split.mjs <png> <parts> — splits a tall screenshot into review tiles
import sharp from "sharp";
const [, , file, partsArg = "4"] = process.argv;
const parts = Number(partsArg);
const m = await sharp(file).metadata();
for (let i = 0; i < parts; i++) {
  const top = Math.floor((i * m.height) / parts);
  const height = Math.min(Math.ceil(m.height / parts), m.height - top);
  await sharp(file).extract({ left: 0, top, width: m.width, height }).resize(Math.min(900, m.width)).toFile(file.replace(".png", `-${i}.png`));
}
console.log("split", parts, "H", m.height);
