// Парсинг ссылок VK Видео → параметры плеера.
// Поддерживаемые форматы ссылок:
//   https://vkvideo.ru/video-123456_789          (oid = -123456, id = 789)
//   https://vk.com/video-123456_789
//   https://vk.com/video_ext.php?oid=-123456&id=789  (уже ссылка для встраивания)
// Возвращаем null, если ссылка не похожа на видео VK.

export interface VkVideoRef {
  oid: string;
  id: string;
}

export function parseVkVideoUrl(raw: string): VkVideoRef | null {
  const url = raw.trim();
  if (!url) return null;

  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host !== "vk.com" && host !== "vkvideo.ru" && host !== "m.vk.com") {
      return null;
    }

    // Уже embed-ссылка: забираем параметры как есть
    if (u.pathname === "/video_ext.php") {
      const oid = u.searchParams.get("oid");
      const id = u.searchParams.get("id");
      if (oid && id && /^-?\d+$/.test(oid) && /^\d+$/.test(id)) {
        return { oid, id };
      }
      return null;
    }

    // https://vk.com/video{oid}_{id} — oid может быть отрицательным (группа)
    const m = u.pathname.match(/^\/video(-?\d+)_(\d+)(?:\/.*)?$/);
    if (m) return { oid: m[1], id: m[2] };

    return null;
  } catch {
    return null;
  }
}

// URL iframe-плеера: воспроизводится прямо на сайте, без перехода на VK.
export function buildVkVideoEmbedUrl(ref: VkVideoRef): string {
  return `https://vk.com/video_ext.php?oid=${encodeURIComponent(ref.oid)}&id=${encodeURIComponent(ref.id)}&hd=2`;
}
