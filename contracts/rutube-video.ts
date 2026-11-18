// Парсинг ссылок Rutube → параметры плеера.
// Поддерживаемые форматы:
//   https://rutube.ru/video/{id}/            (страница видео)
//   https://rutube.ru/play/embed/{id}        (уже ссылка для встраивания)
// Возвращаем null, если ссылка не похожа на видео Rutube.

export interface RutubeVideoRef {
  id: string;
}

export function parseRutubeVideoUrl(raw: string): RutubeVideoRef | null {
  const url = raw.trim();
  if (!url) return null;

  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host !== "rutube.ru") return null;

    let m = u.pathname.match(/^\/video\/([A-Za-z0-9]+)(?:\/.*)?$/);
    if (m) return { id: m[1] };

    m = u.pathname.match(/^\/play\/embed\/([A-Za-z0-9]+)(?:\/.*)?$/);
    if (m) return { id: m[1] };

    return null;
  } catch {
    return null;
  }
}

// URL iframe-плеера Rutube: воспроизводится прямо на сайте.
export function buildRutubeEmbedUrl(ref: RutubeVideoRef): string {
  return `https://rutube.ru/play/embed/${encodeURIComponent(ref.id)}`;
}
