import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { cottages } from "@db/schema";
import { getDb } from "../queries/connection";
import { listExportableBookings } from "../queries/bookings";
import { buildCottageIcs } from "../lib/ical-export";
import { startOfTodayUtc } from "../lib/date-utils";
import { resolveSiteUrl } from "../lib/env";
import { log } from "../lib/logger";

// Экспорт — Hono REST-роут, отдаём .ics по секретному URL.
// НЕ tRPC: краулеры Авито/ЦИАН забирают файл plain HTTP GET без JSON.
// Токен per-property (cottages.ical_export_token); неуспех выглядит как 404,
// чтобы не светить существование объектов.
export const icalRoutes = new Hono();

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && ba.equals(bb);
}

icalRoutes.get("/export/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const token = c.req.query("token") ?? "";
  if (!Number.isInteger(id) || !token) return c.body(null, 404);

  const db = getDb();
  const [cottage] = await db
    .select({
      id: cottages.id,
      title: cottages.title,
      exportToken: cottages.icalExportToken,
    })
    .from(cottages)
    .where(eq(cottages.id, id));

  if (!cottage?.exportToken || !safeEqual(cottage.exportToken, token)) {
    return c.body(null, 404);
  }

  try {
    const rows = await listExportableBookings(id, startOfTodayUtc());
    const host = new URL(resolveSiteUrl(c.req.raw)).host;
    const ics = buildCottageIcs(
      { id: cottage.id, title: cottage.title },
      rows,
      { uidHost: host },
    );
    return c.body(ics, 200, {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="cottage-${id}.ics"`,
      "Cache-Control": "no-cache",
    });
  } catch (e) {
    log.error("ical export failed", {
      cottageId: id,
      error: e instanceof Error ? e.message : String(e),
    });
    return c.body(null, 500);
  }
});
