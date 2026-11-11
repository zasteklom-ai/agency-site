import { and, asc, desc, eq, gte, lte, sql, type SQL } from "drizzle-orm";
import { getDb } from "./connection";
import { cottages } from "@db/schema";
import { storage } from "../lib/storage";

type Photos = { id: number; url: string; sortOrder: number }[];

// presigned URL живёт ~10 минут, поэтому ключи storage:// резолвим при каждом запросе
async function resolvePhotoUrls<T extends { photos: Photos }>(rows: T[]): Promise<T[]> {
  const keys = new Set<string>();
  for (const r of rows)
    for (const p of r.photos)
      if (p.url.startsWith("storage://")) keys.add(p.url.slice(10));
  if (keys.size === 0) return rows;

  const { urls } = await storage.getPresignedUrls({ keys: [...keys] });
  const map = new Map<string, string>();
  for (const u of urls) map.set(u.key, u.url);

  for (const r of rows)
    for (const p of r.photos)
      if (p.url.startsWith("storage://")) {
        const fresh = map.get(p.url.slice(10));
        if (fresh) p.url = fresh;
      }
  return rows;
}

export { resolvePhotoUrls };

export interface CottageFilters {
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  minBeds?: number;
  minArea?: number;
  hasBanya?: boolean;
  hasPool?: boolean;
  hasKupel?: boolean;
  hasSauna?: boolean;
  search?: string;
  sort?: "price_asc" | "price_desc" | "area_desc" | "newest";
  limit?: number;
  offset?: number;
}

export async function findCottages(f: CottageFilters) {
  const db = getDb();
  const conds: SQL[] = [eq(cottages.status, "active")];

  if (f.district) conds.push(eq(cottages.district, f.district));
  if (f.minPrice != null) conds.push(gte(cottages.price, f.minPrice));
  if (f.maxPrice != null) conds.push(lte(cottages.price, f.maxPrice));
  if (f.minBedrooms != null) conds.push(gte(cottages.bedrooms, f.minBedrooms));
  if (f.minBeds != null) conds.push(gte(cottages.beds, f.minBeds));
  if (f.minArea != null) conds.push(gte(cottages.totalArea, f.minArea));
  if (f.hasBanya) conds.push(eq(cottages.hasBanya, true));
  if (f.hasPool) conds.push(eq(cottages.hasPool, true));
  if (f.hasKupel) conds.push(eq(cottages.hasKupel, true));
  if (f.hasSauna) conds.push(eq(cottages.hasSauna, true));
  if (f.search) {
    conds.push(
      sql`(${cottages.title} LIKE ${"%" + f.search + "%"} OR ${cottages.address} LIKE ${"%" + f.search + "%"} OR ${cottages.description} LIKE ${"%" + f.search + "%"})`,
    );
  }

  const order =
    f.sort === "price_asc"
      ? [asc(cottages.price)]
      : f.sort === "price_desc"
        ? [desc(cottages.price)]
        : f.sort === "area_desc"
          ? [desc(cottages.totalArea)]
          : [desc(cottages.id)];

  const rows = await db.query.cottages.findMany({
    where: and(...conds),
    with: { photos: { orderBy: (p, { asc }) => [asc(p.sortOrder)] } },
    orderBy: order,
    limit: f.limit ?? 24,
    offset: f.offset ?? 0,
  });
  await resolvePhotoUrls(rows);

  const [countRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(cottages)
    .where(and(...conds));

  return { items: rows, total: Number(countRow?.count ?? 0) };
}

export async function findCottageById(id: number) {
  const db = getDb();
  const row = await db.query.cottages.findFirst({
    where: eq(cottages.id, id),
    with: { photos: { orderBy: (p, { asc }) => [asc(p.sortOrder)] } },
  });
  if (row) await resolvePhotoUrls([row]);
  return row;
}

export async function findFeaturedCottages(limit = 6) {
  const db = getDb();
  const rows = await db.query.cottages.findMany({
    where: eq(cottages.status, "active"),
    with: { photos: { orderBy: (p, { asc }) => [asc(p.sortOrder)], limit: 1 } },
    orderBy: [desc(cottages.price)],
    limit,
  });
  await resolvePhotoUrls(rows);
  return rows;
}

export async function findDistricts() {
  const db = getDb();
  const rows = await db
    .selectDistinct({ district: cottages.district })
    .from(cottages)
    .where(eq(cottages.status, "active"));
  return rows.map((r) => r.district).filter(Boolean) as string[];
}
