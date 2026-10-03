import { NextResponse } from "next/server";
import { getEventBySlug, isSalesEnabled } from "@/lib/events/queries";

export const dynamic = "force-dynamic";

/** Live availability for the purchase module. Exposes nothing but counts and state. */
export async function GET(_req: Request, ctx: RouteContext<"/api/events/[slug]/availability">) {
  const { slug } = await ctx.params;
  const [view, salesEnabled] = await Promise.all([getEventBySlug(slug), isSalesEnabled()]);
  if (!view) return NextResponse.json({ error: "not_found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  const { availability, event } = view;
  return NextResponse.json(
    {
      state: availability.state,
      remaining: availability.remaining,
      capacity: availability.capacity,
      label: availability.label,
      bookable: availability.bookable && salesEnabled,
      waitlist: availability.waitlist,
      maxPerOrder: Math.min(event.maxTicketsPerOrder, Math.max(0, availability.remaining)),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
