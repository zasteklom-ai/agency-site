import { createElement as el } from "react";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";

// OG-карточка 1200×630: фото объекта + название + район + цена.
// Шрифт Inter подтягиваем с Google Fonts в runtime и кэшируем в памяти
// процесса (шрифт не меняется — кэш бессрочный). Флаг — если сеть недоступна,
// рисуем карточку без кириллического шрифта не можем, поэтому ошибка 500
// с понятным логом; следующий запыт через 5 минут (TTL кэша PNG).

interface OgCottage {
  title: string;
  district: string | null;
  address: string | null;
  price: number | null;
  bedrooms: number | null;
  beds: number | null;
  photoUrl: string | null;
}

interface FontDef {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 500 | 700;
  style: "normal";
}

let fontsPromise: Promise<FontDef[]> | null = null;

function loadFonts(): Promise<FontDef[]> {
  if (!fontsPromise) {
    fontsPromise = (async () => {
      const css = await fetch(
        "https://fonts.googleapis.com/css2?family=Inter:wght@500;700",
        { headers: { "User-Agent": "curl/8.5.0" } }, // TTF, не woff2 (satori не ест woff2)
      ).then((r) => {
        if (!r.ok) throw new Error(`fonts.googleapis HTTP ${r.status}`);
        return r.text();
      });

      const out: FontDef[] = [];
      const re =
        /@font-face\s*{[^}]*font-weight:\s*(\d+);[^}]*url\((https:[^)]+\.ttf)\)[^}]*/g;
      for (const m of css.matchAll(re)) {
        const weight = Number(m[1]) as 400 | 500 | 700;
        const data = await fetch(m[2]).then((r) => {
          if (!r.ok) throw new Error(`font fetch HTTP ${r.status}`);
          return r.arrayBuffer();
        });
        out.push({ name: "Inter", data, weight, style: "normal" });
      }
      if (out.length === 0) throw new Error("no TTF fonts parsed from Google CSS");
      return out;
    })();
    // Не держим битый промис вечно: при ошибке даём следующему запросу повторить
    fontsPromise.catch(() => {
      fontsPromise = null;
    });
  }
  return fontsPromise;
}

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

async function fetchPhotoDataUri(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    if (buf.byteLength === 0 || buf.byteLength > MAX_PHOTO_BYTES) return null;
    const mime = res.headers.get("content-type")?.split(";")[0] || "image/jpeg";
    return `data:${mime};base64,${Buffer.from(buf).toString("base64")}`;
  } catch {
    return null;
  }
}

function formatPrice(v: number | null): string | null {
  return v == null ? null : `${v.toLocaleString("ru-RU")} ₽`;
}

export async function renderOgImage(c: OgCottage): Promise<Buffer> {
  const fonts = await loadFonts();
  const photo = c.photoUrl ? await fetchPhotoDataUri(c.photoUrl) : null;

  const specs = [
    c.bedrooms != null ? `${c.bedrooms} спал.` : null,
    c.beds != null ? `${c.beds} мест` : null,
    c.address,
  ]
    .filter(Boolean)
    .join("  ·  ");

  const svg = await satori(
    el(
      "div",
      {
        style: {
          display: "flex",
          width: "1200px",
          height: "630px",
          backgroundColor: "#141414",
          fontFamily: "Inter",
        },
      },
      el(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: photo ? "620px" : "1200px",
            padding: "56px",
          },
        },
        el(
          "div",
          { style: { display: "flex", flexDirection: "column" } },
          el(
            "div",
            {
              style: {
                color: "#45c1af",
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: 6,
                textTransform: "uppercase",
              },
            },
            "Города Мира",
          ),
          el(
            "div",
            {
              style: {
                marginTop: 28,
                color: "#ffffff",
                fontSize: 52,
                fontWeight: 700,
                lineHeight: 1.15,
              },
            },
            c.title,
          ),
          specs
            ? el(
                "div",
                {
                  style: {
                    marginTop: 24,
                    color: "#9c9c9c",
                    fontSize: 28,
                    fontWeight: 500,
                  },
                },
                specs,
              )
            : null,
        ),
        el(
          "div",
          { style: { display: "flex", flexDirection: "column" } },
          c.price != null
            ? el(
                "div",
                { style: { display: "flex", alignItems: "baseline" } },
                el(
                  "span",
                  { style: { color: "#45c1af", fontSize: 56, fontWeight: 700 } },
                  formatPrice(c.price),
                ),
                el(
                  "span",
                  { style: { marginLeft: 14, color: "#9c9c9c", fontSize: 28 } },
                  "/ сутки",
                ),
              )
            : el(
                "div",
                { style: { color: "#45c1af", fontSize: 36, fontWeight: 700 } },
                "Аренда посуточно",
              ),
          el(
            "div",
            {
              style: {
                marginTop: 14,
                color: "#6f6f6f",
                fontSize: 24,
              },
            },
            c.district ?? "Санкт-Петербург и Ленинградская область",
          ),
        ),
      ),
      photo
        ? el("img", {
            src: photo,
            style: { width: "580px", height: "630px", objectFit: "cover" },
          })
        : null,
    ),
    { width: 1200, height: 630, fonts },
  );

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 1200 },
    background: "rgba(20, 20, 20, 1)",
  });
  return Buffer.from(resvg.render().asPng());
}

// Кэш PNG: LRU + TTL 5 минут. presigned-URL фото живёт ~10 минут, так что
// дёргать storage на каждый запрос соцсети не нужно.
const TTL_MS = 5 * 60 * 1000;
const MAX_ENTRIES = 300;

const cache = new Map<number, { png: Buffer; at: number }>();

export function getCachedOg(id: number): Buffer | null {
  const hit = cache.get(id);
  if (!hit) return null;
  if (Date.now() - hit.at > TTL_MS) {
    cache.delete(id);
    return null;
  }
  // LRU: свежий доступ поднимает запись наверх
  cache.delete(id);
  cache.set(id, hit);
  return hit.png;
}

export function putCachedOg(id: number, png: Buffer): void {
  cache.set(id, { png, at: Date.now() });
  while (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest == null) break;
    cache.delete(oldest);
  }
}

export const OG_TTL_MS = TTL_MS;
