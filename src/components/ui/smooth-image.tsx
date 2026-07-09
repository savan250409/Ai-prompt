import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";

/**
 * next/image with a pure-CSS fade-in (no JS). The image is VISIBLE in the
 * server HTML and fades in via a CSS animation that completes regardless of
 * hydration — so content never waits on JavaScript to appear. Drop-in for
 * <Image fill .../>.
 */
// `alt` is destructured (not just spread) so it's statically visible to
// jsx-a11y and can never be silently omitted by a caller.
export function SmoothImage({ className, alt, ...props }: ImageProps) {
  return <Image alt={alt} {...props} className={cn("animate-media-in", className)} />;
}
