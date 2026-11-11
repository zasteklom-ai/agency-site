import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { createRouter, publicQuery } from "./middleware";
import {
  findCottages,
  findCottageById,
  findFeaturedCottages,
  findDistricts,
  resolvePhotoUrls,
} from "./queries/cottages";
import { getDb } from "./queries/connection";
import { leads, cottages, cottagePhotos } from "@db/schema";
import { storage } from "./lib/storage";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "goroda-mira-admin";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),

  cottages: createRouter({
    list: publicQuery
      .input(
        z.object({
          district: z.string().optional(),
          minPrice: z.number().optional(),
          maxPrice: z.number().optional(),
          minBedrooms: z.number().optional(),
          minBeds: z.number().optional(),
          minArea: z.number().optional(),
          hasBanya: z.boolean().optional(),
          hasPool: z.boolean().optional(),
          hasKupel: z.boolean().optional(),
          hasSauna: z.boolean().optional(),
          search: z.string().optional(),
          sort: z.enum(["price_asc", "price_desc", "area_desc", "newest"]).optional(),
          limit: z.number().optional(),
          offset: z.number().optional(),
        }),
      )
      .query(({ input }) => findCottages(input)),

    byId: publicQuery
      .input(z.object({ id: z.number() }))
      .query(({ input }) => findCottageById(input.id)),

    featured: publicQuery
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(({ input }) => findFeaturedCottages(input?.limit ?? 6)),

    districts: publicQuery.query(() => findDistricts()),
  }),

  leads: createRouter({
    create: publicQuery
      .input(
        z.object({
          name: z.string().min(1),
          phone: z.string().min(5),
          cottageId: z.number().optional(),
          message: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const db = getDb();
        await db.insert(leads).values({
          name: input.name,
          phone: input.phone,
          cottageId: input.cottageId ?? null,
          message: input.message ?? null,
        });
        return { ok: true };
      }),
  }),

  admin: createRouter({
    login: publicQuery
      .input(z.object({ token: z.string() }))
      .mutation(({ input }) => {
        if (input.token !== ADMIN_TOKEN) {
          throw new Error("Неверный пароль");
        }
        return { ok: true, token: ADMIN_TOKEN };
      }),

    listAll: publicQuery
      .input(
        z.object({
          token: z.string(),
          search: z.string().optional(),
          limit: z.number().optional(),
          offset: z.number().optional(),
        }),
      )
      .query(async ({ input }) => {
        if (input.token !== ADMIN_TOKEN) throw new Error("Нет доступа");
        const db = getDb();
        const rows = await db.query.cottages.findMany({
          with: { photos: { limit: 1 } },
          orderBy: (t, { desc }) => [desc(t.id)],
          limit: input.limit ?? 50,
          offset: input.offset ?? 0,
        });
        await resolvePhotoUrls(rows);
        return rows;
      }),

    leadsList: publicQuery
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        if (input.token !== ADMIN_TOKEN) throw new Error("Нет доступа");
        const db = getDb();
        return db.query.leads.findMany({
          orderBy: (t, { desc }) => [desc(t.id)],
          limit: 100,
        });
      }),

    updateStatus: publicQuery
      .input(
        z.object({
          token: z.string(),
          id: z.number(),
          status: z.enum(["active", "hidden", "sold"]),
        }),
      )
      .mutation(async ({ input }) => {
        if (input.token !== ADMIN_TOKEN) throw new Error("Нет доступа");
        const db = getDb();
        await db
          .update(cottages)
          .set({ status: input.status })
          .where(eq(cottages.id, input.id));
        return { ok: true };
      }),

    updatePrice: publicQuery
      .input(
        z.object({
          token: z.string(),
          id: z.number(),
          price: z.number(),
        }),
      )
      .mutation(async ({ input }) => {
        if (input.token !== ADMIN_TOKEN) throw new Error("Нет доступа");
        const db = getDb();
        await db
          .update(cottages)
          .set({ price: input.price })
          .where(eq(cottages.id, input.id));
        return { ok: true };
      }),

    updateCottage: publicQuery
      .input(
        z.object({
          token: z.string(),
          id: z.number(),
          title: z.string().min(1),
          address: z.string().optional(),
          district: z.string().optional(),
          description: z.string().optional(),
          totalArea: z.number().nullable().optional(),
          bedrooms: z.number().nullable().optional(),
          beds: z.number().nullable().optional(),
          price: z.number().nullable().optional(),
          priceWeekday: z.number().nullable().optional(),
          priceFriday: z.number().nullable().optional(),
          priceSaturday: z.number().nullable().optional(),
          priceWeekend: z.number().nullable().optional(),
          priceNewyear: z.number().nullable().optional(),
          deposit: z.number().nullable().optional(),
          amenities: z.array(z.string()),
          status: z.enum(["active", "hidden", "sold"]).optional(),
        }),
      )
      .mutation(async ({ input }) => {
        if (input.token !== ADMIN_TOKEN) throw new Error("Нет доступа");
        const db = getDb();

        // Синхронизируем булевы флаги фильтров с выбранными развлечениями
        const a = input.amenities;
        const has = (...keys: string[]) => a.some((x) => keys.includes(x));

        await db
          .update(cottages)
          .set({
            title: input.title,
            address: input.address,
            district: input.district,
            description: input.description,
            totalArea: input.totalArea ?? null,
            bedrooms: input.bedrooms ?? null,
            beds: input.beds ?? null,
            price: input.price ?? null,
            priceWeekday: input.priceWeekday ?? null,
            priceFriday: input.priceFriday ?? null,
            priceSaturday: input.priceSaturday ?? null,
            priceWeekend: input.priceWeekend ?? null,
            priceNewyear: input.priceNewyear ?? null,
            deposit: input.deposit ?? null,
            amenities: input.amenities.join(", "),
            hasBanya: has("Баня"),
            hasSauna: has("Сауна"),
            hasPool: has("Бассейн крытый", "Бассейн уличный"),
            hasKupel: has("Купель горячая", "Купель холодная"),
            hasBilliard: has("Бильярд"),
            status: input.status ?? "active",
          })
          .where(eq(cottages.id, input.id));
        return { ok: true };
      }),

    createCottage: publicQuery
      .input(
        z.object({
          token: z.string(),
          title: z.string().min(1),
          address: z.string().optional(),
          district: z.string().optional(),
          description: z.string().optional(),
          totalArea: z.number().nullable().optional(),
          bedrooms: z.number().nullable().optional(),
          beds: z.number().nullable().optional(),
          price: z.number().nullable().optional(),
          priceWeekday: z.number().nullable().optional(),
          priceFriday: z.number().nullable().optional(),
          priceSaturday: z.number().nullable().optional(),
          priceWeekend: z.number().nullable().optional(),
          priceNewyear: z.number().nullable().optional(),
          deposit: z.number().nullable().optional(),
          amenities: z.array(z.string()),
          status: z.enum(["active", "hidden", "sold"]).optional(),
        }),
      )
      .mutation(async ({ input }) => {
        if (input.token !== ADMIN_TOKEN) throw new Error("Нет доступа");
        const db = getDb();
        const a = input.amenities;
        const has = (...keys: string[]) => a.some((x) => keys.includes(x));
        const externalId = `manual-${Date.now()}`;

        const [result] = await db.insert(cottages).values({
          externalId,
          title: input.title,
          address: input.address ?? "",
          district: input.district ?? "Ленинградская область",
          description: input.description ?? "",
          totalArea: input.totalArea ?? null,
          bedrooms: input.bedrooms ?? null,
          beds: input.beds ?? null,
          price: input.price ?? null,
          priceWeekday: input.priceWeekday ?? null,
          priceFriday: input.priceFriday ?? null,
          priceSaturday: input.priceSaturday ?? null,
          priceWeekend: input.priceWeekend ?? null,
          priceNewyear: input.priceNewyear ?? null,
          deposit: input.deposit ?? null,
          amenities: input.amenities.join(", "),
          hasBanya: has("Баня"),
          hasSauna: has("Сауна"),
          hasPool: has("Бассейн крытый", "Бассейн уличный"),
          hasKupel: has("Купель горячая", "Купель холодная"),
          hasBilliard: has("Бильярд"),
          status: input.status ?? "active",
        });
        return { ok: true, id: Number(result.insertId) };
      }),

    uploadPhoto: publicQuery
      .input(
        z.object({
          token: z.string(),
          cottageId: z.number(),
          name: z.string(),
          contentBase64: z.string(),
          contentType: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        if (input.token !== ADMIN_TOKEN) throw new Error("Нет доступа");
        // лимит 10 МБ на фото
        if (input.contentBase64.length > 14_000_000) {
          throw new Error("Файл слишком большой (максимум 10 МБ)");
        }
        const db = getDb();
        const bytes = Uint8Array.from(
          Buffer.from(input.contentBase64, "base64"),
        );
        const saved = await storage.uploadFile({
          fileContent: bytes,
          fileName: `cottages/${input.cottageId}/${input.name}`,
          contentType: input.contentType,
        });
        const [maxRow] = await db
          .select({ m: sql<number>`coalesce(max(${cottagePhotos.sortOrder}), -1)` })
          .from(cottagePhotos)
          .where(eq(cottagePhotos.cottageId, input.cottageId));
        // храним ключ хранилища, а не presigned URL (URL живёт ~10 минут)
        await db.insert(cottagePhotos).values({
          cottageId: input.cottageId,
          url: `storage://${saved.key}`,
          sortOrder: Number(maxRow?.m ?? -1) + 1,
        });
        const url = (await storage.getPresignedUrl({ key: saved.key })).url;
        return { ok: true, url };
      }),

    deletePhoto: publicQuery
      .input(z.object({ token: z.string(), photoId: z.number() }))
      .mutation(async ({ input }) => {
        if (input.token !== ADMIN_TOKEN) throw new Error("Нет доступа");
        const db = getDb();
        await db
          .delete(cottagePhotos)
          .where(eq(cottagePhotos.id, input.photoId));
        return { ok: true };
      }),

    reorderPhotos: publicQuery
      .input(
        z.object({
          token: z.string(),
          cottageId: z.number(),
          orderedIds: z.array(z.number()),
        }),
      )
      .mutation(async ({ input }) => {
        if (input.token !== ADMIN_TOKEN) throw new Error("Нет доступа");
        const db = getDb();
        for (let i = 0; i < input.orderedIds.length; i++) {
          await db
            .update(cottagePhotos)
            .set({ sortOrder: i })
            .where(eq(cottagePhotos.id, input.orderedIds[i]));
        }
        return { ok: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
