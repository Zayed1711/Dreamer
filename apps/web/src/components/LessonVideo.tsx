"use client";

interface LessonVideoProps {
  videoUrl: string;
  title: string;
}

/**
 * Extracts a YouTube ID from standard formats (watch?v=, youtu.be/, or raw id).
 */
function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const match =
    url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/) ||
    url.match(/^[a-zA-Z0-9_-]{11}$/);
  return match ? (match[1] ?? match[0] ?? null) : null;
}

/**
 * Swappable video player component supporting unlisted YouTube embeds.
 */
export function LessonVideo({ videoUrl, title }: LessonVideoProps) {
  const youtubeId = extractYouTubeId(videoUrl);

  if (!youtubeId) {
    return (
      <div className="window flex aspect-video w-full items-center justify-center p-4 text-center">
        <p className="font-mono text-xs text-[var(--muted)]">Video stream not available</p>
      </div>
    );
  }

  return (
    <div className="window relative aspect-video w-full overflow-hidden bg-black">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 h-full w-full border-0"
      />
    </div>
  );
}
