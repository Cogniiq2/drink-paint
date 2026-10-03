// Visual review helper: node scripts/shot.mjs <path> <name> [width] [height] [fullPage]
import { chromium } from "playwright";
const [, , path = "/", name = "home", w = "1440", h = "900", full = "1"] = process.argv;
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) }, deviceScaleFactor: 1 });
await page.goto(`http://localhost:3000${path}`, { waitUntil: "networkidle", timeout: 90000 });
await page.waitForTimeout(1800);
await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 160)); } window.scrollTo(0, document.body.scrollHeight); await new Promise(r => setTimeout(r, 400)); window.scrollTo(0, 0); });
await page.waitForTimeout(800);
console.log("reveals", await page.evaluate(() => [document.querySelectorAll(".reveal,.reveal-scale").length, document.querySelectorAll(".is-in").length]));
const out = `${process.env.SHOT_DIR ?? "./screenshots"}/${name}.png`;
await page.screenshot({ path: out, fullPage: full === "1" });
const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
console.log(out, "overflowX:", overflow);
await browser.close();
