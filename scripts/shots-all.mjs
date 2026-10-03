// Visual review pass: node scripts/shots-all.mjs  (server on :3000, fresh state preferred)
import { chromium } from "playwright";
const base = "http://localhost:3000";
const dir = process.env.SHOT_DIR ?? "./screenshots";
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});

async function shoot(page, name) {
  await page.waitForTimeout(1500);
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } window.scrollTo(0, document.body.scrollHeight); await new Promise(r => setTimeout(r, 400)); window.scrollTo(0, 0); });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${dir}/${name}.png`, fullPage: true });
  const ovf = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  console.log(name, ovf ? "OVERFLOW-X!" : "ok");
}

for (const [label, vp] of [["d", { width: 1440, height: 900 }], ["m", { width: 390, height: 844 }]]) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, isMobile: label === "m", hasTouch: label === "m" });
  const page = await ctx.newPage();
  for (const [path, name] of [["/events/canvas-wine-no-02", "event"], ["/events", "events"], ["/private-events", "private"], ["/atelier", "atelier"], ["/waitlist?event=late-edition-no-03", "waitlist"], ["/faq", "faq"], ["/gutschein", "voucher"], ["/contact", "contact"], ["/impressum", "impressum"], ["/nope", "404"], ["/checkout/canvas-wine-no-02?qty=2", "checkout"]]) {
    await page.goto(base + path, { waitUntil: "networkidle" });
    await shoot(page, `${name}-${label}`);
  }
  // purchase → success
  await page.goto(base + "/checkout/canvas-wine-no-02?qty=2", { waitUntil: "networkidle" });
  await page.fill('input[name="firstName"]', "Lena");
  await page.fill('input[name="lastName"]', "Muster");
  await page.fill('input[name="email"]', "lena@example.com");
  await page.check('input[name="terms"]');
  await page.getByRole("button", { name: "Zahlungspflichtig buchen" }).click();
  await page.waitForURL(/dev-pay/);
  await shoot(page, `devpay-${label}`);
  await page.getByRole("button", { name: "Zahlung erfolgreich" }).click();
  await page.waitForURL(/success/);
  await shoot(page, `success-${label}`);
  // hero at viewport (not full page) to judge composition
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `${dir}/hero-${label}.png` });
  if (label === "m") {
    await page.getByRole("button", { name: /Menü/ }).click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${dir}/menu-m.png` });
  }
  await ctx.close();
}
// admin
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto(base + "/admin/login");
await page.fill('input[name="password"]', "local-dev-password-123");
await page.getByRole("button", { name: "Anmelden" }).click();
await page.waitForURL(/\/admin$/);
await page.screenshot({ path: `${dir}/admin-dash.png`, fullPage: true });
await page.goto(base + "/admin/events");
await page.screenshot({ path: `${dir}/admin-events.png`, fullPage: true });
await page.goto(base + "/admin/attendees");
await page.screenshot({ path: `${dir}/admin-attendees.png`, fullPage: true });
await browser.close();
console.log("done");
