import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery, protectedProcedure } from "./middleware";
import {
  findCottages,
  findCottageById,
  findFeaturedCottages,
  findDistricts,
  resolvePhotoUrls,
} from "./queries/cottages";
import {
  cancelRange,
  listBookingsByProperty,
  upsertBooking,
} from "./queries/bookings";
import { getDb } from "./queries/connection";
import { leads, cottages, cottagePhotos } from "@db/schema";
import { storage } from "./lib/storage";
import { clientIp, rateLimit } from "./lib/ratelimit";
import { sendTelegramLead } from "./lib/telegram";
import { resolveSiteUrl } from "./lib/env";
import { syncCottageIcal } from "./lib/ical-sync";
import { parseVkVideoUrl } from "@contracts/vk-video";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "goroda-mira-admin";

const icalUrl = z
  .string()
  .trim()
  .max(1024)
  .refine((u) => u.startsWith("https://") || u.startsWith("http://"), {
    message: "URL должен начинаться с http(s)://",
  });

// Ссылка на видео VK Видео: принимаем пустую или валидную ссылку на видео
const vkVideoUrl = z
  .string()
  .trim()
  .max(1024)
  .refine((u) => u === "" || parseVkVideoUrl(u) !== null, {
    message:
      "Непонятная ссылка на видео. Пример: https://vkvideo.ru/video-123456_789",
  });

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
    // Rate-limit обязателен — иначе бота заблокируют за спам.
    create: publicQuery
      .input(
        z.object({
          name: z.string().trim().min(1, "Укажите имя").max(128),
          phone: z.string().trim().min(5, "Укажите телефон").max(32),
          cottageId: z.number().optional(),
          checkIn: z.date().optional(),
          checkOut: z.date().optional(),
          guests: z.number().int().min(1).max(100).optional(),
          message: z.string().trim().max(2000).optional(),
          // Honeypot: люди не заполняют это поле (скрыто), боты заполняют.
          website: z.string().optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        // Притворяемся успехом, но ничего не сохраняем и никуда не шлём
        if (input.website) return { ok: true };

        const ip = clientIp(ctx.req);
        const rl = rateLimit(`lead:${ip}`, 10, 10 * 60 * 1000);
        if (!rl.allowed) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Слишком много заявок. Попробуйте через несколько минут.",
          });
        }

        if (input.checkIn && input.checkOut && input.checkOut <= input.checkIn) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Дата выезда должна быть позже даты заезда",
          });
        }

        const db = getDb();
        let propertyTitle: string | null = null;
        if (input.cottageId != null) {
          const [c] = await db
            .select({ title: cottages.title })
            .from(cottages)
            .where(eq(cottages.id, input.cottageId));
          propertyTitle = c?.title ?? null;
        }

        await db.insert(leads).values({
          name: input.name,
          phone: input.phone,
          cottageId: input.cottageId ?? null,
          checkIn: input.checkIn ?? null,
          checkOut: input.checkOut ?? null,
          guests: input.guests ?? null,
          message: input.message ?? null,
        });

        // Telegram — best effort: заявка уже в БД, сбой уведомления не должен
        // выглядеть для клиента как сбой отправки формы
        await sendTelegramLead({
          propertyTitle,
          propertyId: input.cottageId ?? null,
          name: input.name,
          phone: input.phone,
          checkIn: input.checkIn ?? null,
          checkOut: input.checkOut ?? null,
          guests: input.guests ?? null,
          message: input.message ?? null,
        });

        return { ok: true };
      }),
  }),

  // Календарь на карточке — только чтение, источник — tRPC + TanStack Query.
  // В админке — полное редактирование через tRPC-мутации.
  booking: createRouter({
    listByProperty: publicQuery
      .input(
        z.object({
          cottageId: z.number().int(),
          from: z.date().optional(),
          to: z.date().optional(),
        }),
      )
      .query(({ input }) => {
        const to = input.to ?? new Date(Date.now() + 365 * 24 * 3600 * 1000);
        const from =
          input.from ?? new Date(Date.now() - 90 * 24 * 3600 * 1000);
        return listBookingsByProperty(input.cottageId, from, to);
      }),

    upsert: protectedProcedure
      .input(
        z.object({
          cottageId: z.number().int(),
          startDate: z.date(),
          endDate: z.date(),
          status: z.enum(["BOOKED", "BLOCKED", "AVAILABLE"]),
          priceOverride: z.number().int().positive().nullable().optional(),
          comment: z.string().trim().max(255).optional(),
        }),
      )
      .mutation(({ input }) => upsertBooking(input)),

    deleteRange: protectedProcedure
      .input(
        z.object({
          cottageId: z.number().int(),
          startDate: z.date(),
          endDate: z.date(),
        }),
      )
      .mutation(({ input }) => cancelRange(input)),
  }),

  ical: createRouter({
    getSettings: protectedProcedure
      .input(z.object({ cottageId: z.number().int() }))
      .query(async ({ input, ctx }) => {
        const db = getDb();
        const [cottage] = await db
          .select({
            id: cottages.id,
            title: cottages.title,
            token: cottages.icalExportToken,
            avito: cottages.icalImportAvitoUrl,
            cian: cottages.icalImportCianUrl,
          })
          .from(cottages)
          .where(eq(cottages.id, input.cottageId));
        if (!cottage) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Объект не найден" });
        }

        // Токен генерируем лениво при первом открытии настроек
        let token = cottage.token;
        if (!token) {
          token = randomUUID();
          await db
            .update(cottages)
            .set({ icalExportToken: token })
            .where(eq(cottages.id, cottage.id));
        }

        const site = resolveSiteUrl(ctx.req);
        return {
          exportUrl: `${site}/api/ical/export/${cottage.id}?token=${token}`,
          importAvitoUrl: cottage.avito,
          importCianUrl: cottage.cian,
        };
      }),

    saveSettings: protectedProcedure
      .input(
        z.object({
          cottageId: z.number().int(),
          importAvitoUrl: icalUrl.nullable().optional(),
          importCianUrl: icalUrl.nullable().optional(),
          regenerateExportToken: z.boolean().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const db = getDb();
        const set: Partial<typeof cottages.$inferInsert> = {};
        if (input.importAvitoUrl !== undefined) {
          set.icalImportAvitoUrl = input.importAvitoUrl || null;
        }
        if (input.importCianUrl !== undefined) {
          set.icalImportCianUrl = input.importCianUrl || null;
        }
        if (input.regenerateExportToken) {
          set.icalExportToken = randomUUID();
        }
        if (Object.keys(set).length === 0) return { ok: true };
        await db.update(cottages).set(set).where(eq(cottages.id, input.cottageId));
        return { ok: true };
      }),

    syncProperty: protectedProcedure
      .input(z.object({ cottageId: z.number().int() }))
      .mutation(async ({ input }) => {
        const results = await syncCottageIcal(input.cottageId);
        if (results.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Для объекта не заданы URL импорта iCal",
          });
        }
        return { results };
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
          videoUrl: vkVideoUrl.optional(),
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
            videoUrl: input.videoUrl !== undefined ? input.videoUrl || null : undefined,
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
          videoUrl: vkVideoUrl.optional(),
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
          videoUrl: input.videoUrl || null,
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
