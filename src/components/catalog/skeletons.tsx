import { Container } from "@/components/layout/container";

/**
 * Lightweight loading skeletons used by route-level loading.tsx files so inner
 * pages open INSTANTLY (the skeleton paints on click while data streams in),
 * instead of the browser blocking on the server render.
 */

const Box = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse rounded-card bg-surface-2 ${className}`} />
);

/** Detail page (image / video / filter): preview + side panel + recommendations. */
export function DetailSkeleton() {
  return (
    <Container className="py-8">
      {/* breadcrumb */}
      <Box className="mb-6 h-4 w-48 rounded-pill" />
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        {/* preview */}
        <Box className="aspect-[3/4] w-full" />
        {/* panel */}
        <div className="space-y-4">
          <Box className="h-8 w-3/4 rounded-pill" />
          <Box className="h-4 w-1/2 rounded-pill" />
          <Box className="h-28 w-full" />
          <Box className="h-12 w-full rounded-pill" />
          <div className="flex gap-3">
            <Box className="h-11 flex-1 rounded-pill" />
            <Box className="h-11 w-11 rounded-pill" />
          </div>
        </div>
      </div>
      {/* recommended row */}
      <Box className="mb-4 mt-12 h-5 w-40 rounded-pill" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Box key={i} className="aspect-[3/4]" />
        ))}
      </div>
    </Container>
  );
}

/** Category listing: hero header + masonry grid of cards. */
export function CategorySkeleton() {
  const heights = ["h-72", "h-96", "h-80", "h-64", "h-96", "h-72", "h-80", "h-64"];
  return (
    <>
      <Container className="pt-10">
        <Box className="mb-4 h-4 w-40 rounded-pill" />
        <Box className="h-9 w-64 rounded-pill" />
        <Box className="mt-3 h-4 w-40 rounded-pill" />
      </Container>
      <Container className="py-10">
        <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 [&>*]:mb-4">
          {heights.map((h, i) => (
            <Box key={i} className={`w-full ${h} break-inside-avoid`} />
          ))}
        </div>
      </Container>
    </>
  );
}
