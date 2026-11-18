import { resolveVideoEmbedUrl } from "@/lib/video-url";

export function VideoEmbed({ url, title }: { url: string; title: string }) {
  const embed = resolveVideoEmbedUrl(url);
  if (!embed) return null;
  return (
    <div className="relative aspect-video w-full overflow-hidden bg-[#141414]">
      <iframe
        src={embed}
        title={title}
        loading="lazy"
        allow="encrypted-media; fullscreen; picture-in-picture; autoplay"
        allowFullScreen
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}
