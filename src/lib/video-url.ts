// Резолв ссылки на видео в URL iframe-плеера. Отдельный модуль без
// компонентов, чтобы VideoEmbed.tsx не ловил react-refresh/only-export-components.
import { parseVkVideoUrl, buildVkVideoEmbedUrl } from "@contracts/vk-video";
import {
  parseRutubeVideoUrl,
  buildRutubeEmbedUrl,
} from "@contracts/rutube-video";

// Поддерживаем Rutube и VK Видео; null — ссылка не распознана.
export function resolveVideoEmbedUrl(url: string): string | null {
  const vk = parseVkVideoUrl(url);
  if (vk) return buildVkVideoEmbedUrl(vk);
  const rutube = parseRutubeVideoUrl(url);
  if (rutube) return buildRutubeEmbedUrl(rutube);
  return null;
}
