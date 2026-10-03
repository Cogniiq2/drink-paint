/* End-to-end QA. Spawns a fresh production server (in-memory demo store, no Stripe) on port 3100.
   Requires a prior `next build` and PUBLIC_SALES_ENABLED=true + admin credentials in .env.local. */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
const port = 3100;
const base = `http://localhost:${port}`;
const server = spawn("node", ["node_modules/next/dist/bin/next", "start", "-p", String(port)], { stdio: ["ignore", "pipe", "pipe"], detached: true, env: { ...process.env, NEXT_PUBLIC_SITE_URL: base } });
await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error("server start timeout")), 60000);
  server.stdout.on("data", (d) => { if (String(d).includes("Ready")) { clearTimeout(t); resolve(); } });
  server.stderr.on("data", (d) => process.stderr.write(d));
});
const stop = () => { try { process.kill(-server.pid, "SIGTERM"); } catch {} };
process.on("exit", stop);
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const results = [];
const check = (name, ok, info = "") => { results.push({ name, ok, info }); console.log(`${ok ? "PASS" : "FAIL"} ${name} ${info}`); };

const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));

// 1. Home → event with few seats
await page.goto(base + "/", { waitUntil: "networkidle" });
check("home 200 + title", (await page.title()).includes("BoLaGio"), await page.title());
const ld = await page.$$eval('script[type="application/ld+json"]', (els) => els.map((e) => JSON.parse(e.textContent)));
check("home JSON-LD present", ld.length > 0 && JSON.stringify(ld).includes('"Event"'));
await page.goto(base + "/events/paint-the-night-no-01", { waitUntil: "networkidle" });
const label1 = await page.locator('aside div[aria-live="polite"]').innerText();
check("event shows live label", label1.includes("Noch 3"), label1);
const evLd = await page.$$eval('script[type="application/ld+json"]', (els) => els.map((e) => JSON.parse(e.textContent)));
const evSchema = evLd.flat().find((x) => x["@type"] === "Event");
check("event JSON-LD remaining=3 & InStock", evSchema?.remainingAttendeeCapacity === 3 && evSchema.offers.availability.endsWith("InStock"), JSON.stringify(evSchema?.offers));

// quantity → 2 → checkout
await page.getByRole("button", { name: "Mehr" }).click();
await page.getByRole("link", { name: /Zur Buchung/ }).click();
await page.waitForURL(/\/checkout\/paint-the-night-no-01\?qty=2/);
check("checkout url carries qty", page.url().includes("qty=2"));
// submit empty → errors
await page.getByRole("button", { name: "Zahlungspflichtig buchen" }).click();
await page.waitForFunction(() => document.querySelectorAll('[role="alert"]').length >= 4);
const alerts = await page.locator('[role="alert"]:not(next-route-announcer *)').allInnerTexts();
check("checkout validation errors shown", alerts.filter(Boolean).length === 4, JSON.stringify(alerts));
const emptyAlerts = await page.$$eval('[role="alert"]', (els) => els.filter((e) => !e.textContent.trim()).map((e) => e.outerHTML.slice(0, 200)));
check("no empty alert regions", emptyAlerts.length === 0, emptyAlerts.join(" | "));
await page.fill('input[name="firstName"]', "Lena");
await page.fill('input[name="lastName"]', "Muster");
await page.fill('input[name="email"]', "lena@example.com");
await page.check('input[name="terms"]');
await page.getByRole("button", { name: "Zahlungspflichtig buchen" }).click();
await page.waitForURL(/\/checkout\/dev-pay\?order=/);
check("hold created → dev-pay", true);
// while on dev-pay, availability must account for the hold (3-2 = 1)
const avail = await (await page.request.get(base + "/api/events/paint-the-night-no-01/availability")).json();
check("availability reflects hold", avail.remaining === 1 && avail.label === "Noch 1 Platz", JSON.stringify(avail));
await page.getByRole("button", { name: "Zahlung erfolgreich" }).click();
await page.waitForURL(/\/checkout\/success/);
await page.waitForSelector("h1");
check("success headline", (await page.locator("h1").innerText()).includes("reserviert"));
check("success shows 2 tickets", (await page.locator("img[alt^='QR-Code']").count()) === 2);
const ref = await page.locator("dd.font-mono").innerText();
check("order reference BLG-", ref.startsWith("BLG-"), ref);
const ics = await page.request.get(base + "/api/events/paint-the-night-no-01/calendar.ics");
check("ics served", ics.status() === 200 && (await ics.text()).includes("BEGIN:VEVENT"));

// 2. Overbuy: event now has 1 seat; request 2 via checkout url
await page.goto(base + "/checkout/paint-the-night-no-01?qty=2", { waitUntil: "networkidle" });
const qtyShown = await page.locator("output").innerText();
check("checkout clamps qty to remaining", qtyShown.trim() === "1", qtyShown);
// 3. cancel flow: start checkout for 1 then cancel
await page.fill('input[name="firstName"]', "Max");
await page.fill('input[name="lastName"]', "Test");
await page.fill('input[name="email"]', "max@example.com");
await page.check('input[name="terms"]');
await page.getByRole("button", { name: "Zahlungspflichtig buchen" }).click();
await page.waitForURL(/dev-pay/);
let a2 = await (await page.request.get(base + "/api/events/paint-the-night-no-01/availability")).json();
check("hold makes event sold out", a2.remaining === 0 && a2.state === "sold_out", JSON.stringify(a2));
await page.getByRole("button", { name: "Abbrechen" }).click();
await page.waitForURL(/checkout\/cancelled/);
check("cancelled page", (await page.locator("h1").innerText()).includes("Kein Problem"));
a2 = await (await page.request.get(base + "/api/events/paint-the-night-no-01/availability")).json();
check("hold released after cancel", a2.remaining === 1, JSON.stringify(a2));

// 4. Sold-out event → waitlist
await page.goto(base + "/events/late-edition-no-03", { waitUntil: "networkidle" });
check("sold out module", (await page.locator("aside").innerText()).includes("Ausverkauft"));
await page.locator("aside").getByRole("link", { name: "Auf die Warteliste" }).click();
await page.waitForURL(/\/waitlist\?event=late-edition-no-03/);
await page.fill('input[name="name"]', "Jana");
await page.fill('input[name="email"]', "jana@example.com");
await page.getByRole("button", { name: "Eintragen" }).click();
await page.waitForSelector('[role="status"]');
check("waitlist joined", (await page.locator('[role="status"]').innerText()).includes("auf der Liste"));
await page.goto(base + "/waitlist?event=late-edition-no-03");
await page.fill('input[name="name"]', "Jana");
await page.fill('input[name="email"]', "JANA@example.com");
await page.getByRole("button", { name: "Eintragen" }).click();
await page.waitForSelector('[role="status"]');
check("waitlist duplicate handled", (await page.locator('[role="status"]').innerText()).includes("bereits"));

// 5. Private inquiry
await page.goto(base + "/private-events", { waitUntil: "networkidle" });
await page.fill('input[name="name"]', "Team Cogniiq");
await page.fill('input[name="email"]', "team@example.com");
await page.selectOption('select[name="eventType"]', "Teamevent");
await page.fill('input[name="guests"]', "14");
await page.getByRole("button", { name: "Anfrage senden" }).click();
await page.waitForSelector('[role="status"]');
check("inquiry sent", (await page.locator('[role="status"]').innerText()).includes("Danke"));

// 6. Admin
await page.goto(base + "/admin", { waitUntil: "networkidle" });
check("admin redirects to login", page.url().includes("/admin/login"));
await page.fill('input[name="password"]', "wrong");
await page.getByRole("button", { name: "Anmelden" }).click();
await page.waitForSelector("text=Falsches Passwort.");
check("wrong password rejected", true);
await page.fill('input[name="password"]', "local-dev-password-123");
await page.getByRole("button", { name: "Anmelden" }).click();
await page.waitForURL(/\/admin$/);
check("admin login ok", (await page.locator("h1").innerText()).includes("Übersicht"));
await page.goto(base + "/admin/attendees?q=lena");
check("attendee listed", (await page.content()).includes("lena@example.com"));
await page.getByRole("button", { name: "einchecken" }).first().click();
await page.waitForSelector("text=eingecheckt ✓");
check("manual check-in", true);
const csv = await page.request.get(base + "/api/admin/export");
check("csv export", csv.status() === 200 && (await csv.text()).includes("lena@example.com"));
await page.goto(base + "/admin/waitlist");
check("waitlist in admin", (await page.content()).includes("jana@example.com"));
await page.goto(base + "/admin/inquiries");
check("inquiry in admin", (await page.content()).includes("team@example.com"));
await page.goto(base + "/admin");
check("dev outbox lists mails", (await page.content()).includes("Dein Platz ist reserviert"));

// 7. SEO endpoints & 404
const sm = await page.request.get(base + "/sitemap.xml");
check("sitemap", sm.status() === 200 && (await sm.text()).includes("/events/paint-the-night-no-01"));
const rb = await page.request.get(base + "/robots.txt");
check("robots", (await rb.text()).includes("Disallow: /admin"));
await page.goto(base + "/events/paint-the-night-no-01");
const ogUrl = await page.getAttribute('meta[property="og:image"]', "content");
const og = await page.request.get(ogUrl.replace(/^https?:\/\/[^/]+/, base)); // NEXT_PUBLIC_SITE_URL is inlined at build time
check("og image png", og.status() === 200 && og.headers()["content-type"].includes("image/png"), ogUrl);
const nf = await page.request.get(base + "/events/does-not-exist");
check("404 status", nf.status() === 404);
const unauth = await (await browser.newContext()).request.get(base + "/api/admin/export", { maxRedirects: 0 });
check("export unauthorized without cookie", unauth.status() === 401 || unauth.status() === 307, String(unauth.status()));

// 8. Reduced motion + keyboard
const rm = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 390, height: 844 } });
const mp = await rm.newPage();
await mp.goto(base + "/", { waitUntil: "networkidle" });
const hidden = await mp.$$eval(".reveal", (els) => els.filter((e) => getComputedStyle(e).opacity === "0").length);
check("reduced motion: nothing hidden", hidden === 0, `hidden=${hidden}`);
await mp.keyboard.press("Tab");
const first = await mp.evaluate(() => document.activeElement?.textContent?.trim());
check("skip link first in tab order", first === "Zum Inhalt springen", first);
await mp.getByRole("button", { name: /Menü/ }).click();
await mp.waitForSelector('[role="dialog"]');
await mp.keyboard.press("Escape");
check("mobile menu closes on Escape", (await mp.locator('[role="dialog"]').count()) === 0);
const ovf = await mp.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
check("mobile no horizontal overflow", !ovf);

await browser.close();
stop();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
