import { getStore } from "@/lib/data";
import { buildIcs } from "@/lib/calendar/ics";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: RouteContext<"/api/events/[slug]/calendar.ics">) {
  const { slug } = await ctx.params;
  const ev = await getStore().getPublishedEventBySlug(slug);
  if (!ev) return new Response("Not found", { status: 404 });
  return new Response(buildIcs(ev), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}.ics"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}
