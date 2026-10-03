/**
 * Cloudflare Worker entry.
 *
 * - `fetch` is vinext's own handler, forwarded unchanged.
 * - `scheduled` is the Cloudflare replacement for the hourly Vercel cron in
 *   vercel.json. It calls the existing /api/cron/reminders route in-process
 *   (no network hop), with the same Bearer CRON_SECRET check as on Vercel.
 *
 * Only used by the Cloudflare build (`npm run build:cf`). The standard Next.js
 * build never imports this file.
 */
import handler from "vinext/server/fetch-handler";

export * from "vinext/server/fetch-handler";

type WorkerEnv = {
  CRON_SECRET?: string;
  NEXT_PUBLIC_SITE_URL?: string;
  ASSETS?: { fetch(request: Request): Promise<Response> | Response };
};

type WorkerCtx = {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
};

type VinextHandler = {
  fetch(request: Request, env?: WorkerEnv, ctx?: WorkerCtx): Promise<Response>;
};

const app = handler as unknown as VinextHandler;

const worker = {
  fetch(request: Request, env: WorkerEnv, ctx: WorkerCtx): Promise<Response> {
    return app.fetch(request, env, ctx);
  },

  async scheduled(_controller: unknown, env: WorkerEnv, ctx: WorkerCtx): Promise<void> {
    const secret = env.CRON_SECRET;
    if (!secret) {
      console.warn("[cron] CRON_SECRET is not set; skipping reminder run.");
      return;
    }
    const origin = (env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://localhost").replace(/\/$/, "");
    const request = new Request(`${origin}/api/cron/reminders`, { headers: { authorization: `Bearer ${secret}` } });
    const response = await app.fetch(request, env, ctx);
    const body = await response.text();
    console.log(`[cron] reminders -> ${response.status} ${body}`);
    if (!response.ok) throw new Error(`Reminder cron failed with status ${response.status}`);
  },
};

export default worker;
