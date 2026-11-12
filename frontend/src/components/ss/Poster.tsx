import type { Video } from "@/lib/store";
import { cn } from "@/lib/utils";
// Original abstract artwork uses shared palette tokens.
export function Poster({
  video,
  className,
  showTitle = true,
}: {
  video: Video;
  className?: string;
  showTitle?: boolean;
}) {
  return (
    <div
      className={cn(
        "poster-background relative overflow-hidden rounded-md",
        className,
      )}
      role="img"
      aria-label={`Poster for ${video.title}`}
    >
      <div className="poster-glow absolute left-[40%] top-[8%] aspect-square w-[70%] rounded-full" />
      <div className="poster-shade absolute inset-x-0 bottom-0 h-1/2" />
      <div className="absolute left-0 right-0 top-[58%] h-px bg-poster-light/30" />
      {showTitle && (
        <p className="absolute bottom-3 left-3 right-3 text-sm font-semibold leading-tight text-poster-light">
          {video.title}
        </p>
      )}
    </div>
  );
}
