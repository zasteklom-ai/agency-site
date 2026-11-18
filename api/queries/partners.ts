import { asc, eq, ne, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getDb } from "./connection";
import { partners } from "@db/schema";
import type { PartnerInput } from "@contracts/partners";

// Публичная выдача: только опубликованные, в порядке sortOrder.
export async function listPublishedPartners() {
  const db = getDb();
  return db
    .select()
    .from(partners)
    .where(eq(partners.isPublished, true))
    .orderBy(asc(partners.sortOrder), asc(partners.id));
}

export async function findPartnerBySlug(slug: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(partners)
    .where(and(eq(partners.slug, slug), eq(partners.isPublished, true)));
  return row ?? null;
}

export async function listAllPartners() {
  const db = getDb();
  return db.select().from(partners).orderBy(asc(partners.sortOrder), asc(partners.id));
}

export async function findPartnerById(id: number) {
  const db = getDb();
  const [row] = await db.select().from(partners).where(eq(partners.id, id));
  return row ?? null;
}

async function assertSlugFree(slug: string, exceptId?: number) {
  const db = getDb();
  const cond =
    exceptId != null
      ? and(eq(partners.slug, slug), ne(partners.id, exceptId))
      : eq(partners.slug, slug);
  const [dup] = await db.select({ id: partners.id }).from(partners).where(cond);
  if (dup) {
    throw new TRPCError({
      code: "CONFLICT",
      message: `Площадка со slug «${slug}» уже существует`,
    });
  }
}

export async function createPartner(input: PartnerInput) {
  await assertSlugFree(input.slug);
  const db = getDb();
  const [result] = await db.insert(partners).values(input);
  return { id: Number(result.insertId) };
}

export async function updatePartner(id: number, input: PartnerInput) {
  const db = getDb();
  const existing = await findPartnerById(id);
  if (!existing) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Площадка не найдена" });
  }
  await assertSlugFree(input.slug, id);
  await db.update(partners).set(input).where(eq(partners.id, id));
  return { ok: true as const };
}

export async function setPartnerPublished(id: number, isPublished: boolean) {
  const db = getDb();
  const existing = await findPartnerById(id);
  if (!existing) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Площадка не найдена" });
  }
  await db.update(partners).set({ isPublished }).where(eq(partners.id, id));
  return { ok: true as const };
}

export async function deletePartner(id: number) {
  const db = getDb();
  const existing = await findPartnerById(id);
  if (!existing) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Площадка не найдена" });
  }
  await db.delete(partners).where(eq(partners.id, id));
  return { ok: true as const };
}
