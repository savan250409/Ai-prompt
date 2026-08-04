/** Inline JSON-LD structured data (server component). */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // data is built from our own constants — safe to inline
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
