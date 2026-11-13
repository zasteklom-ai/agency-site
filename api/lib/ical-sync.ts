import { and, eq, gt, inArray, lt, ne, sql } from "drizzle-orm";
import { bookings, cottages } from "@db/schema";
import { getDb } from "../queries/connection";
import { log } from "./logger";
import { parseIcal } from "./ical-parse";

// Импорт — парсим внешние .ics каждые 15 минут, не перезатираем MANUAL-брони.
// Merge-ключ: (cottage_id, source, external_uid). Событие исчезло из ленты —
// строку переводим в CANCELLED; появилось снова — возвращаем BOOKED.

export type IcalSource = "AVITO" | "CIAN";

export interface SourceSyncResult {
  source: IcalSource;
  url: string;
  fetched: number;
  created: number;
  updated: number;
  cancelled: number;
  skippedManualConflicts: number;
  error?: string;
}

async function fetchIcalText(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "text/calendar,*/*" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    if (text.length > 5 * 1024 * 1024) throw new Error("файл больше 5 МБ");
    return text;
  } finally {
    clearTimeout(timer);
  }
}

async function syncSource(
  cottageId: number,
  source: IcalSource,
  url: string,
): Promise<SourceSyncResult> {
  const result: SourceSyncResult = {
    source,
    url,
    fetched: 0,
    created: 0,
    updated: 0,
    cancelled: 0,
    skippedManualConflicts: 0,
  };

  let text: string;
  try {
    text = await fetchIcalText(url);
  } catch (e) {
    result.error = e instanceof Error ? e.message : String(e);
    log.warn("ical import fetch failed", { cottageId, source, error: result.error });
    return result;
  }

  let parsed: ReturnType<typeof parseIcal>;
  try {
    parsed = parseIcal(text);
  } catch (e) {
    // Битый .ics не должен ронять весь цикл синхронизации
    result.error = `parse: ${e instanceof Error ? e.message : String(e)}`;
    log.warn("ical import parse failed", {
      cottageId,
      source,
      error: result.error,
    });
    return result;
  }
  const { events, skippedNoUid } = parsed;
  if (skippedNoUid > 0) {
    log.warn("ical events without uid skipped", { cottageId, source, count: skippedNoUid });
  }
  result.fetched = events.length;

  const db = getDb();
  await db.transaction(async (tx) => {
    // Сериализуемся с ручными правками календаря и созданием броней
    await tx.execute(
      sql`SELECT id FROM cottages WHERE id = ${cottageId} FOR UPDATE`,
    );

    const existing = await tx
      .select()
      .from(bookings)
      .where(
        and(eq(bookings.cottageId, cottageId), eq(bookings.source, source)),
      );
    const byUid = new Map(existing.map((r) => [r.externalUid ?? "", r]));
    const fetchedUids = new Set(events.map((e) => e.uid));

    for (const ev of events) {
      const row = byUid.get(ev.uid);

      if (row) {
        const changed =
          row.status !== "BOOKED" ||
          row.startDate.getTime() !== ev.startDay.getTime() ||
          row.endDate.getTime() !== ev.endDayExclusive.getTime() ||
          (row.comment ?? null) !== ev.summary;
        if (changed) {
          await tx
            .update(bookings)
            .set({
              status: "BOOKED",
              startDate: ev.startDay,
              endDate: ev.endDayExclusive,
              comment: ev.summary,
            })
            .where(eq(bookings.id, row.id));
          result.updated++;
        }
        continue;
      }

      // Новое событие: конфликтует с ручной бронью — НЕ перезатираем, warning.
      const [conflict] = await tx
        .select({ id: bookings.id })
        .from(bookings)
        .where(
          and(
            eq(bookings.cottageId, cottageId),
            ne(bookings.status, "CANCELLED"),
            // Даты биндим как параметры (UTC-инстанты): сравнение со строкой
            // привело бы к сдвигу на часовой пояс сессии MySQL.
            lt(bookings.startDate, ev.endDayExclusive),
            gt(bookings.endDate, ev.startDay),
          ),
        )
        .limit(1);

      if (conflict) {
        result.skippedManualConflicts++;
        log.warn("ical event overlaps manual booking, skipped", {
          cottageId,
          source,
          uid: ev.uid,
        });
        continue;
      }

      await tx.insert(bookings).values({
        cottageId,
        startDate: ev.startDay,
        endDate: ev.endDayExclusive,
        status: "BOOKED",
        source,
        externalUid: ev.uid.slice(0, 128),
        comment: ev.summary,
      });
      result.created++;
    }

    // Исчезнувшие события → CANCELLED (бронь внешняя: read-only, но её
    // отмену фиксируем статусом, физически ничего не удаляем)
    const gone = existing.filter(
      (r) => !fetchedUids.has(r.externalUid ?? "") && r.status !== "CANCELLED",
    );
    if (gone.length > 0) {
      await tx
        .update(bookings)
        .set({ status: "CANCELLED" })
        .where(inArray(bookings.id, gone.map((r) => r.id)));
      result.cancelled = gone.length;
    }
  });

  return result;
}

export async function syncCottageIcal(
  cottageId: number,
): Promise<SourceSyncResult[]> {
  const db = getDb();
  const [cottage] = await db
    .select({
      avito: cottages.icalImportAvitoUrl,
      cian: cottages.icalImportCianUrl,
    })
    .from(cottages)
    .where(eq(cottages.id, cottageId));
  if (!cottage) return [];

  const jobs: Promise<SourceSyncResult>[] = [];
  if (cottage.avito) jobs.push(syncSource(cottageId, "AVITO", cottage.avito));
  if (cottage.cian) jobs.push(syncSource(cottageId, "CIAN", cottage.cian));
  return Promise.all(jobs);
}

// Ручной брони с source=ICAL сейчас нет — столбец оставлен под будущие ленты
// (Ostrovok/Airbnb). Объекты без import URL пропускаем молча.
export async function syncAllCottages(): Promise<void> {
  const db = getDb();
  const rows = await db
    .select({
      id: cottages.id,
      avito: cottages.icalImportAvitoUrl,
      cian: cottages.icalImportCianUrl,
    })
    .from(cottages)
    .where(
      sql`(${cottages.icalImportAvitoUrl} IS NOT NULL AND ${cottages.icalImportAvitoUrl} != '') OR (${cottages.icalImportCianUrl} IS NOT NULL AND ${cottages.icalImportCianUrl} != '')`,
    );

  let created = 0;
  let cancelled = 0;
  let failed = 0;
  for (const row of rows) {
    try {
      const results = await syncCottageIcal(row.id);
      for (const r of results) {
        created += r.created;
        cancelled += r.cancelled;
        if (r.error) failed++;
      }
    } catch (e) {
      failed++;
      log.error("ical sync failed", {
        cottageId: row.id,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }
  log.info("ical sync finished", {
    cottages: rows.length,
    created,
    cancelled,
    failed,
  });
}
