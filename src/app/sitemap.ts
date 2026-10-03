import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo/metadata";
import { getStore } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();
  const statics: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/events`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/atelier`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/private-events`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/gutschein`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
  ];
  const events = await getStore().listPublishedUpcomingEvents(50);
  return [
    ...statics,
    ...events.map((e) => ({ url: `${base}/events/${e.slug}`, lastModified: new Date(e.updatedAt), changeFrequency: "daily" as const, priority: 0.9 })),
  ];
}
