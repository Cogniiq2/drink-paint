import { NextResponse } from "next/server";
import { env } from "@/config/env";
import { getStore } from "@/lib/data";
import { sendMail } from "@/lib/email/mailer";
import { eventReminder } from "@/lib/email/templates";

export const dynamic = "force-dynamic";

/**
 * Sends the "Bis morgen" reminder to paid guests of evenings starting in the
 * next 20–28 hours. Run hourly (vercel.json). Idempotent via reminder_sent_at.
 */
export async function GET(req: Request) {
  const secret = env().CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const store = getStore();
  const now = Date.now();
  const from = new Date(now + 20 * 3600_000).toISOString();
  const to = new Date(now + 28 * 3600_000).toISOString();
  const due = await store.listOrdersNeedingReminder(from, to);
  const results = await Promise.all(due.map(({ order, event }) => sendMail({ to: order.email, ...eventReminder(order, event) })));
  const sent = due.filter((_, i) => results[i].ok).map((d) => d.order.id);
  await store.markReminderSent(sent);
  return NextResponse.json({ due: due.length, sent: sent.length });
}
