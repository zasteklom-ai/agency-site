import { eq, inArray, sql } from "drizzle-orm";
import { getDb } from "../queries/connection";
import { cottages, cottagePhotos } from "@db/schema";
import { storage } from "./storage";
import { log } from "./logger";
import {
  parseFeedXml,
  amenityFlags,
  type FeedError,
  type FeedOffer,
} from "./xml-feed";

// Импорт объектов из XML-фида. Связь с БД — по externalId (= internal-id
// фида): существующие обновляются полностью, новые создаются active.
// Фото: source_url в cottage_photos — merge-ключ. Совпавшие оставляем,
// исчезнувшие из фида удаляем, новые скачиваем и кладём в storage.
// Фото, загруженные вручную (source_url IS NULL), импорт не трогает.

const PHOTO_TIMEOUT_MS = 15_000;
const PHOTO_MAX_BYTES = 12 * 1024 * 1024;
const PHOTO_CONCURRENCY = 4;

const FEED_TIMEOUT_MS = 30_000;
export const FEED_MAX_BYTES = 18 * 1024 * 1024;

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const MIME_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export interface FeedWarning {
  externalId: string;
  message: string;
}

export interface FeedImportPlan {
  totalOffers: number;
  toCreate: number;
  toUpdate: number;
  photos: number;
  errors: FeedError[];
  items: {
    externalId: string;
    title: string;
    action: "create" | "update";
    photos: number;
  }[];
}

export interface FeedImportResult {
  processed: number;
  created: number;
  updated: number;
  failed: FeedError[];
  warnings: FeedWarning[];
  photos: { downloaded: number; kept: number; removed: number; failed: number };
  durationMs: number;
}

export function decodeFeedXml(xmlBase64: string): string {
  const xml = Buffer.from(xmlBase64, "base64").toString("utf8").replace(/^\uFEFF/, "");
  if (!xml.trimStart().startsWith("<")) {
    throw new Error("Файл не похож на XML (должен начинаться с «<»)");
  }
  return xml;
}

export async function planFeedImport(
  xml: string,
): Promise<FeedImportPlan> {
  const { offers, errors } = parseFeedXml(xml);
  const db = getDb();
  const rows = await db.select({ id: cottages.id, externalId: cottages.externalId }).from(cottages);
  const byExternalId = new Set(rows.map((r) => r.externalId));

  const items = offers.map((o) => ({
    externalId: o.externalId,
    title: o.title,
    action: (byExternalId.has(o.externalId) ? "update" : "create") as "create" | "update",
    photos: o.photos.length,
  }));
  return {
    totalOffers: offers.length,
    toCreate: items.filter((i) => i.action === "create").length,
    toUpdate: items.filter((i) => i.action === "update").length,
    photos: offers.reduce((n, o) => n + o.photos.length, 0),
    errors,
    items,
  };
}

function cottageSet(
  o: FeedOffer,
): Partial<typeof cottages.$inferInsert> {
  const flags = amenityFlags(o.amenities);
  const all: Partial<typeof cottages.$inferInsert> = {
    title: o.title,
    description: o.description,
    address: o.address,
    district: o.district,
    lat: o.lat,
    lng: o.lng,
    bedrooms: o.bedrooms,
    beds: o.beds,
    totalArea: o.totalArea,
    landArea: o.landArea,
    price: o.price,
    amenities: o.amenities.length > 0 ? o.amenities.join(", ") : null,
    ...(o.amenities.length > 0 ? flags : {}),
  };
  // На update затираем только поля, реально присутствующие в фиде:
  // у CRM-фида нет beds/цен по дням недели/депозита — ручные данные сайта
  // null-ами не уничтожаются. Удобства синхронизируем, только если фид
  // вообще несёт распознаваемые теги удобств (иначе список пуст).
  const set: Partial<typeof cottages.$inferInsert> = {};
  for (const [k, v] of Object.entries(all)) {
    if (v !== null && v !== undefined) {
      (set as Record<string, unknown>)[k] = v;
    }
  }
  return set;
}

/** Базовая защита от SSRF: фид приходит от админа, но URL фото всё равно
 * ведут на чужие хосты — не даём стянуть файл с loopback/приватной сети. */
function isPrivateHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (h === "localhost" || h === "::1" || h.endsWith(".local") || h.endsWith(".internal")) return true;
  if (h === "0.0.0.0") return true;
  if (/^127\./.test(h) || /^10\./.test(h) || /^192\.168\./.test(h) || /^169\.254\./.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;
  if (h.startsWith("fe80:") || h.startsWith("fc") || h.startsWith("fd")) return true;
  return false;
}

/** Скачиваем фид по URL (режим «вставить ссылку» в админке). Тот же
 * SSRF-гвард, что и для фото; лимит — как на загрузку файла с компьютера. */
export async function fetchFeedByUrl(
  url: string,
  opts: { allowPrivateHosts?: boolean } = {},
): Promise<string> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Некорректный URL фида");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("URL фида должен начинаться с http(s)://");
  }
  if (!opts.allowPrivateHosts && isPrivateHost(parsed.hostname)) {
    throw new Error("Запрещённый хост фида (localhost/приватная сеть)");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FEED_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url, { signal: controller.signal });
  } catch (e) {
    throw new Error(
      e instanceof Error && e.name === "AbortError"
        ? "Таймаут скачивания фида (30 с)"
        : `Фид недоступен: ${e instanceof Error ? e.message : String(e)}`,
    );
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) throw new Error(`Фид вернул HTTP ${res.status}`);

  const declared = Number(res.headers.get("content-length") ?? 0);
  if (declared > FEED_MAX_BYTES) {
    throw new Error("Фид больше 18 МБ — разбейте на части");
  }
  const text = await res.text();
  if (text.length > FEED_MAX_BYTES) {
    throw new Error("Фид больше 18 МБ — разбейте на части");
  }
  return text;
}

interface DownloadedPhoto {
  bytes: Uint8Array;
  ext: string;
  contentType: string;
}

async function fetchPhoto(
  url: string,
  allowPrivateHosts: boolean,
): Promise<DownloadedPhoto> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("некорректный URL");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("не http(s) URL");
  }
  if (!allowPrivateHosts && isPrivateHost(parsed.hostname)) {
    throw new Error("запрещённый хост (localhost/приватная сеть)");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PHOTO_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url, { signal: controller.signal });
  } catch (e) {
    throw new Error(e instanceof Error && e.name === "AbortError" ? "таймаут 15 с" : "нет соединения");
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes.byteLength === 0) throw new Error("пустой файл");
  if (bytes.byteLength > PHOTO_MAX_BYTES) throw new Error("фото больше 12 МБ");

  const contentType = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  const pathExt = parsed.pathname.match(/\.[a-z0-9]+$/i)?.[0].toLowerCase() ?? "";
  if (contentType.startsWith("image/")) {
    return { bytes, ext: MIME_EXT[contentType] ?? pathExt ?? ".jpg", contentType };
  }
  if (IMAGE_EXT.has(pathExt)) {
    return { bytes, ext: pathExt, contentType: "image/jpeg" };
  }
  throw new Error(`не изображение (${contentType || "неизвестный тип"})`);
}

async function mapPool<T, R>(items: T[], n: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(n, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      out[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return out;
}

interface ImportOptions {
  /** Импортировать только эти externalId (порядок = порядок фида). Батчи
   * нужны UI: сайт отдаёт фид целиком, фронт гоняет импорт частями. */
  onlyExternalIds?: string[];
  /** Только для тестов: разрешить фото с localhost/приватных адресов. */
  allowPrivatePhotoHosts?: boolean;
  /** Тестовый шов загрузки в storage. По умолчанию — платформенный
   * storage-синглтон; e2e-прогон подменяет, чтобы не зависеть от
   * выдачи KIMI_* в окружении. */
  uploader?: (p: {
    bytes: Uint8Array;
    fileName: string;
    contentType: string;
  }) => Promise<{ key: string }>;
}

async function uploadToStorage(p: {
  bytes: Uint8Array;
  fileName: string;
  contentType: string;
}): Promise<{ key: string }> {
  const saved = await storage.uploadFile({
    fileContent: p.bytes,
    fileName: p.fileName,
    contentType: p.contentType,
  });
  return { key: saved.key };
}

export async function importFeed(
  xml: string,
  opts: ImportOptions = {},
): Promise<FeedImportResult> {
  const started = Date.now();
  const { offers, errors: parseErrors } = parseFeedXml(xml);
  const db = getDb();

  let selected = offers;
  if (opts.onlyExternalIds) {
    const wanted = new Set(opts.onlyExternalIds);
    selected = offers.filter((o) => wanted.has(o.externalId));
  }

  const existing = await db
    .select({ id: cottages.id, externalId: cottages.externalId })
    .from(cottages);
  const idByExternalId = new Map(existing.map((r) => [r.externalId, r.id]));

  const result: FeedImportResult = {
    processed: 0,
    created: 0,
    updated: 0,
    failed: [...parseErrors],
    warnings: [],
    photos: { downloaded: 0, kept: 0, removed: 0, failed: 0 },
    durationMs: 0,
  };

  for (const offer of selected) {
    try {
      await importOffer(offer, idByExternalId, result, opts);
      result.processed++;
    } catch (e) {
      result.failed.push({
        index: -1,
        externalId: offer.externalId,
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  result.durationMs = Date.now() - started;
  log.info("feed import finished", {
    processed: result.processed,
    created: result.created,
    updated: result.updated,
    failed: result.failed.length,
    photos: result.photos,
    durationMs: result.durationMs,
  });
  return result;
}

async function importOffer(
  offer: FeedOffer,
  idByExternalId: Map<string, number>,
  result: FeedImportResult,
  opts: ImportOptions,
): Promise<void> {
  const db = getDb();
  const set = cottageSet(offer);
  const existingId = idByExternalId.get(offer.externalId);

  let cottageId: number;
  if (existingId != null) {
    await db.update(cottages).set(set).where(eq(cottages.id, existingId));
    cottageId = existingId;
    result.updated++;
  } else {
    const [r] = await db.insert(cottages).values({
      ...set,
      // title у FeedOffer всегда заполнен (генерируется при отсутствии в фиде),
      // поэтому для insert возвращаем его явно — Partial тип его опционализирует
      title: offer.title,
      externalId: offer.externalId,
      status: "active",
    });
    cottageId = Number(r.insertId);
    idByExternalId.set(offer.externalId, cottageId);
    result.created++;
  }

  await syncPhotos(cottageId, offer, result, opts);
}

async function syncPhotos(
  cottageId: number,
  offer: FeedOffer,
  result: FeedImportResult,
  opts: ImportOptions,
): Promise<void> {
  const db = getDb();
  const rows = await db
    .select()
    .from(cottagePhotos)
    .where(eq(cottagePhotos.cottageId, cottageId));

  const feedUrls = offer.photos;
  const feedSet = new Set(feedUrls);
  const bySourceUrl = new Map(rows.filter((r) => r.sourceUrl != null).map((r) => [r.sourceUrl!, r]));

  const removeRows = rows.filter((r) => r.sourceUrl != null && !feedSet.has(r.sourceUrl));
  const keepRows = rows.filter((r) => r.sourceUrl != null && feedSet.has(r.sourceUrl));
  const manualRows = rows.filter((r) => r.sourceUrl == null);
  const toDownload = feedUrls.filter((u) => !bySourceUrl.has(u));

  // 1. Скачиваем новые фото и кладём в storage (вне транзакции — сеть не должна
  //    держать локи на строках коттеджа)
  const downloaded = await mapPool(toDownload, PHOTO_CONCURRENCY, async (url) => {
    try {
      return { url, ...(await fetchPhoto(url, opts.allowPrivatePhotoHosts ?? false)) };
    } catch (e) {
      result.photos.failed++;
      result.warnings.push({
        externalId: offer.externalId,
        message: `фото ${url}: ${e instanceof Error ? e.message : String(e)}`,
      });
      return { url, failed: true as const };
    }
  });

  const newPhotos = downloaded.filter((d): d is { url: string } & DownloadedPhoto => !("failed" in d));
  const upload = opts.uploader ?? uploadToStorage;
  const uploaded: { url: string; key: string }[] = [];
  for (let i = 0; i < newPhotos.length; i++) {
    const p = newPhotos[i];
    try {
      const saved = await upload({
        bytes: p.bytes,
        fileName: `cottages/${cottageId}/feed-${Date.now()}-${i}${p.ext}`,
        contentType: p.contentType,
      });
      uploaded.push({ url: p.url, key: saved.key });
      result.photos.downloaded++;
    } catch (e) {
      result.photos.failed++;
      result.warnings.push({
        externalId: offer.externalId,
        message: `загрузка фото в storage (${p.url}): ${e instanceof Error ? e.message : String(e)}`,
      });
    }
  }

  // 2. Применяем разницу в одной транзакции
  await db.transaction(async (tx) => {
    await tx.execute(
      // Сериализуемся с ручными правками фото этого объекта
      sql`SELECT id FROM cottages WHERE id = ${cottageId} FOR UPDATE`,
    );

    if (removeRows.length > 0) {
      await tx
        .delete(cottagePhotos)
        .where(
          inArray(
            cottagePhotos.id,
            removeRows.map((r) => r.id),
          ),
        );
      result.photos.removed += removeRows.length;
    }

    // Порядок: фид-фото по индексу фида, ручные — после них с сохранением относительного порядка
    for (let i = 0; i < feedUrls.length; i++) {
      const row = bySourceUrl.get(feedUrls[i]);
      if (row && row.sortOrder !== i) {
        await tx.update(cottagePhotos).set({ sortOrder: i }).where(eq(cottagePhotos.id, row.id));
      }
    }
    let order = feedUrls.length;
    for (const row of manualRows.sort((a, b) => a.sortOrder - b.sortOrder)) {
      if (row.sortOrder !== order) {
        await tx.update(cottagePhotos).set({ sortOrder: order }).where(eq(cottagePhotos.id, row.id));
      }
      order++;
    }

    for (let i = 0; i < uploaded.length; i++) {
      const idx = feedUrls.indexOf(uploaded[i].url);
      await tx.insert(cottagePhotos).values({
        cottageId,
        url: `storage://${uploaded[i].key}`,
        sortOrder: idx,
        sourceUrl: uploaded[i].url,
      });
    }
  });

  result.photos.kept += keepRows.length;

  // Удалённые из фида storage-объекты чистим best-effort (как deletePhoto —
  // ошибки storage не считаем ошибкой импорта). Вызов через async-обёртку:
  // синглтон storage может кинуть синхронно ещё на этапе обращения к
  // прокси (storage не выдан в окружении) — это тоже должно уходить в warn.
  for (const row of removeRows) {
    if (row.url.startsWith("storage://")) {
      void safeDeleteStorageFile(row.url.slice(10), cottageId);
    }
  }
}

async function safeDeleteStorageFile(key: string, cottageId: number): Promise<void> {
  try {
    await storage.deleteFile({ fileKey: key });
  } catch (e) {
    log.warn("feed import: storage cleanup failed", {
      cottageId,
      key,
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
