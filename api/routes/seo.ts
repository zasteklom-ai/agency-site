import { Hono } from "hono";
import { asc, eq } from "drizzle-orm";
import { cottagePhotos, cottages } from "@db/schema";
import { getDb } from "../queries/connection";
import { resolveSiteUrl } from "../lib/env";
import { getCachedOg, putCachedOg, renderOgImage } from "../lib/og-image";
import { resolvePhotoUrls } from "../queries/cottages";
import { log } from "../lib/logger";

// SEO-роуты на Hono: sitemap.xml и robots.txt динамические (объекты и даты
// меняются), OG-картинка генерируется на лету и кэшируется.
export const seoRoutes = new Hono();

function escXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const STATIC_PAGES: { path: string; priority: string }[] = [
  { path: "/", priority: "1.0" },
  { path: "/catalog", priority: "0.9" },
  { path: "/events", priority: "0.6" },
  { path: "/reviews", priority: "0.6" },
  { path: "/about", priority: "0.4" },
  { path: "/contacts", priority: "0.4" },
];

seoRoutes.get("/sitemap.xml", async (c) => {
  const db = getDb();
  const rows = await db
    .select({ id: cottages.id, updatedAt: cottages.updatedAt })
    .from(cottages)
    .where(eq(cottages.status, "active"))
    .orderBy(asc(cottages.id));

  const site = resolveSiteUrl(c.req.raw);
  const urls: string[] = [];
  for (const p of STATIC_PAGES) {
    urls.push(
      `  <url><loc>${escXml(site + p.path)}</loc><priority>${p.priority}</priority></url>`,
    );
  }
  for (const r of rows) {
    const lastmod = r.updatedAt.toISOString().slice(0, 10);
    urls.push(
      `  <url><loc>${escXml(`${site}/cottage/${r.id}`)}</loc><lastmod>${lastmod}</lastmod><priority>0.8</priority></url>`,
    );
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;
  return c.body(xml, 200, { "Content-Type": "application/xml; charset=utf-8" });
});

seoRoutes.get("/robots.txt", (c) => {
  const site = resolveSiteUrl(c.req.raw);
  return c.body(
    `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

Sitemap: ${site}/sitemap.xml
`,
    200,
    { "Content-Type": "text/plain; charset=utf-8" },
  );
});

seoRoutes.get("/api/og/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return c.body(null, 404);

  const cached = getCachedOg(id);
  if (cached) {
    // Hono принимает Uint8Array<ArrayBuffer>, Buffer подтипом не является
    return c.body(new Uint8Array(cached), 200, {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=300",
    });
  }

  const db = getDb();
  const cottage = await db.query.cottages.findFirst({
    where: eq(cottages.id, id),
    with: { photos: { orderBy: asc(cottagePhotos.sortOrder), limit: 1 } },
  });
  if (!cottage) return c.body(null, 404);

  await resolvePhotoUrls([cottage]);
  const rawPhoto = cottage.photos[0]?.url ?? null;
  // В БД фото могут лежать относительными путями (/photos/...) — резолвим в абсолютный URL
  const photo =
    rawPhoto == null
      ? null
      : rawPhoto.startsWith("http")
        ? rawPhoto
        : `${resolveSiteUrl(c.req.raw)}${rawPhoto}`;

  try {
    const png = await renderOgImage({
      title: cottage.title,
      district: cottage.district,
      address: cottage.address,
      price: cottage.priceWeekday ?? cottage.price,
      bedrooms: cottage.bedrooms,
      beds: cottage.beds,
      photoUrl: photo,
    });
    putCachedOg(id, png);
    return c.body(new Uint8Array(png), 200, {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=300",
    });
  } catch (e) {
    log.error("og render failed", {
      cottageId: id,
      error: e instanceof Error ? e.message : String(e),
    });
    return c.body(null, 500);
  }
});
