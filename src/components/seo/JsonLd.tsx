/** Renders JSON-LD safely. Accepts one object or a list. */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const payload = Array.isArray(data) ? data : [data];
  return (
    <script
      type="application/ld+json"
      // JSON inside <script> must escape "<" to prevent breaking out of the tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload.length === 1 ? payload[0] : payload).replace(/</g, "\\u003c") }}
    />
  );
}
