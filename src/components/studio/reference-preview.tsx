import Image from "next/image";

/**
 * The thing you're generating FROM — the prompt's still/clip, the filter's
 * style sample, or the tool's example output. Shown on every generate screen
 * so you always see your reference while you configure the run.
 */
export function ReferencePreview({
  label,
  name,
  image,
  video,
  className,
}: {
  label: string;
  name: string;
  image: string | null;
  /** looping clip for video prompts; falls back to `image` as its poster */
  video?: string | null;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="mb-2 text-caption font-medium uppercase tracking-wide text-low">{label}</p>

      <div className="relative aspect-square overflow-hidden rounded-card border border-hairline bg-surface-2">
        {video ? (
          <video
            src={video}
            poster={image ?? undefined}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="h-full w-full object-cover"
          />
        ) : image ? (
          <Image
            src={image}
            // decorative: the caption below names it
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 40vw"
            className="object-cover"
          />
        ) : (
          <div className="grid h-full place-items-center text-caption text-low">No preview</div>
        )}

        <div className="media-scrim pointer-events-none absolute inset-0" />
        <span className="absolute bottom-3 left-3 line-clamp-1 max-w-[calc(100%-1.5rem)] rounded-pill bg-black/45 px-2.5 py-1 text-caption text-white/90 backdrop-blur-sm">
          {name}
        </span>
      </div>
    </div>
  );
}
