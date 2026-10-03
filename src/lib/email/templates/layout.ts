import { site } from "@/config/site";
import { siteUrl } from "@/lib/seo/metadata";

export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/**
 * One restrained table-based layout for every transactional mail. System
 * serif for the headline (web fonts are unreliable in mail), sans for body.
 */
export function emailLayout(opts: { preheader: string; headline: string; bodyHtml: string; footerNote?: string }): string {
  const base = siteUrl();
  return `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(opts.headline)}</title></head>
<body style="margin:0;padding:0;background:#EEE8DD;">
<span style="display:none;max-height:0;overflow:hidden;color:transparent;">${esc(opts.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EEE8DD;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#F7F3EB;border:1px solid rgba(22,20,17,0.12);">
<tr><td style="padding:28px 32px 0;font-family:Georgia,'Times New Roman',serif;font-size:20px;color:#161411;letter-spacing:-0.01em;">
  <a href="${base}" style="color:#161411;text-decoration:none;">${esc(site.brand.wordmark[0])} <em>${esc(site.brand.wordmark[1])}</em></a>
</td></tr>
<tr><td style="padding:28px 32px 8px;font-family:Georgia,'Times New Roman',serif;font-size:32px;line-height:1.05;color:#161411;letter-spacing:-0.02em;">${esc(opts.headline)}</td></tr>
<tr><td style="padding:8px 32px 32px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:#24201C;">${opts.bodyHtml}</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid rgba(22,20,17,0.12);font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;color:#6d655a;">
  ${site.company.legalName} · ${esc(site.address.street)}, ${esc(site.address.postalCode)} ${esc(site.address.city)}<br>
  ${opts.footerNote ? esc(opts.footerNote) + "<br>" : ""}
  <a href="${base}/impressum" style="color:#6d655a;">Impressum</a> · <a href="${base}/datenschutz" style="color:#6d655a;">Datenschutz</a>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

export const row = (k: string, v: string) =>
  `<tr><td style="padding:8px 0;border-bottom:1px solid rgba(22,20,17,0.12);color:#6d655a;width:38%;vertical-align:top;">${esc(k)}</td><td style="padding:8px 0;border-bottom:1px solid rgba(22,20,17,0.12);color:#161411;">${v}</td></tr>`;
export const table = (rows: string) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin:12px 0 20px;">${rows}</table>`;
export const button = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:#161411;color:#F7F3EB;text-decoration:none;padding:12px 20px;font-size:14px;font-weight:500;">${esc(label)}</a>`;
export const p = (s: string) => `<p style="margin:0 0 14px;">${s}</p>`;
