// Яндекс.Метрика: подключение счётчика, SPA-хиты и цели для рекламы.
// Счётчик активируется, когда в src/config.ts указан YANDEX_METRIKA_ID.
import { YANDEX_METRIKA_ID } from "@/config";

declare global {
  interface Window {
    ym?: (id: number, action: string, ...args: unknown[]) => void;
  }
}

let initialized = false;

export function initMetrika() {
  if (initialized || !YANDEX_METRIKA_ID) return;
  initialized = true;

  const id = YANDEX_METRIKA_ID;

  // Официальный сниппет Метрики (webvisor, карта кликов, точный показатель отказов)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  w.ym =
    w.ym ||
    function (...args: unknown[]) {
      (w.ym.a = w.ym.a || []).push(args);
    };
  w.ym.l = Date.now();
  if (!w.csrfu) {
    const k = document.createElement("script");
    k.async = true;
    k.src = "https://mc.yandex.ru/metrika/tag.js";
    const first = document.getElementsByTagName("script")[0];
    first?.parentNode?.insertBefore(k, first);
  }

  window.ym?.(id, "init", {
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: true,
  });

  // noscript-фолбэк для посетителей без JS
  const ns = document.createElement("noscript");
  ns.innerHTML = `<div><img src="https://mc.yandex.ru/watch/${id}" style="position:absolute;left:-9999px" alt="" /></div>`;
  document.body.appendChild(ns);
}

/** Хит просмотра страницы (для SPA-навигации) */
export function metrikaHit(url: string, title?: string) {
  if (!YANDEX_METRIKA_ID || !window.ym) return;
  window.ym(YANDEX_METRIKA_ID, "hit", url, { title });
}

/** Достижение цели (заявка, звонок, клик по мессенджеру и т.д.) */
export function reachGoal(
  goal: string,
  params?: Record<string, unknown>,
) {
  if (!YANDEX_METRIKA_ID || !window.ym) return;
  window.ym(YANDEX_METRIKA_ID, "reachGoal", goal, params);
}
