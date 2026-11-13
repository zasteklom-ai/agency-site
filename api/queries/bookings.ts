import { and, asc, eq, gt, lt, ne, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { bookings } from "@db/schema";
import { getDb } from "./connection";
import { toUtcDay } from "../lib/date-utils";

export type BookingStatus = "BOOKED" | "BLOCKED" | "AVAILABLE" | "CANCELLED";
export type BookingSource = "MANUAL" | "AVITO" | "CIAN" | "ICAL";

// Календарь на карточке — только чтение, источник — tRPC + TanStack Query.
export async function listBookingsByProperty(
  cottageId: number,
  from: Date,
  to: Date,
) {
  const db = getDb();
  return db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.cottageId, cottageId),
        ne(bookings.status, "CANCELLED"),
        gt(bookings.endDate, toUtcDay(from)),
        lt(bookings.startDate, toUtcDay(to)),
      ),
    )
    .orderBy(asc(bookings.startDate));
}

export interface UpsertBookingInput {
  cottageId: number;
  startDate: Date;
  endDate: Date;
  status: BookingStatus;
  priceOverride?: number | null;
  comment?: string | null;
}

// В админке — полное редактирование через tRPC-мутации.
// Правило «никакого овербукинга»: строка коттеджа блокируется FOR UPDATE,
// любое пересечение с активной (не CANCELLED) строкой — CONFLICT.
// Повторный save той же строки (точное совпадение диапазона) — апдейт, а не конфликт.
export async function upsertBooking(input: UpsertBookingInput) {
  const db = getDb();
  const start = toUtcDay(input.startDate);
  const end = toUtcDay(input.endDate);

  if (end <= start) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Дата выезда должна быть позже даты заезда",
    });
  }

  return db.transaction(async (tx) => {
    // Блокировка на уровне коттеджа сериализует параллельные правки календаря.
    // Raw SQL: у типизированного билдера forUpdate теряется в Omit после where().
    const locked = (await tx.execute(
      sql`SELECT id FROM cottages WHERE id = ${input.cottageId} FOR UPDATE`,
    )) as unknown as { id: number }[];
    if (locked.length === 0) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Объект не найден" });
    }

    const overlapping = await tx
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.cottageId, input.cottageId),
          ne(bookings.status, "CANCELLED"),
          lt(bookings.startDate, end),
          gt(bookings.endDate, start),
        ),
      );

    // Точное совпадение диапазона = редактирование существующей строки
    const exact = overlapping.find(
      (b) => b.startDate.getTime() === start.getTime() && b.endDate.getTime() === end.getTime(),
    );
    if (overlapping.length > 0 && !exact) {
      const b = overlapping[0];
      throw new TRPCError({
        code: "CONFLICT",
        message: `Даты пересекаются с существующей записью (${b.startDate.toLocaleDateString("ru-RU")} — ${b.endDate.toLocaleDateString("ru-RU")}). Сначала освободите эти даты.`,
      });
    }

    const values = {
      status: input.status,
      priceOverride: input.priceOverride ?? null,
      comment: input.comment?.trim() ? input.comment.trim().slice(0, 255) : null,
    };

    if (exact && exact.source === "MANUAL") {
      await tx.update(bookings).set(values).where(eq(bookings.id, exact.id));
      return { id: exact.id, updated: true as const };
    }
    if (exact) {
      // Внешние брони read-only для ручных правок
      throw new TRPCError({
        code: "CONFLICT",
        message:
          "Эти даты заняты бронью из внешнего источника (Авито/ЦИАН). Управляйте ей на стороне площадки или через iCal-синхронизацию.",
      });
    }

    const [result] = await tx.insert(bookings).values({
      cottageId: input.cottageId,
      startDate: start,
      endDate: end,
      source: "MANUAL",
      ...values,
    });
    return { id: Number(result.insertId), updated: false as const };
  });
}

export interface DeleteRangeInput {
  cottageId: number;
  startDate: Date;
  endDate: Date;
}

// Освобождение диапазона: MANUAL-записи переводятся в CANCELLED (брони не
// удаляются физически — сохраняем историю). Внешние брони не трогаем:
// они read-only и управляются синхронизацией.
export async function cancelRange(input: DeleteRangeInput) {
  const db = getDb();
  const start = toUtcDay(input.startDate);
  const end = toUtcDay(input.endDate);

  return db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT id FROM cottages WHERE id = ${input.cottageId} FOR UPDATE`,
    );

    const result = await tx
      .update(bookings)
      .set({ status: "CANCELLED" })
      .where(
        and(
          eq(bookings.cottageId, input.cottageId),
          eq(bookings.source, "MANUAL"),
          ne(bookings.status, "CANCELLED"),
          lt(bookings.startDate, end),
          gt(bookings.endDate, start),
        ),
      );
    return { cancelled: result[0].affectedRows ?? 0 };
  });
}

// Для iCal-экспорта: активные брони/блокировки, пересекающиеся с [from, ∞).
export async function listExportableBookings(cottageId: number, from: Date) {
  const db = getDb();
  return db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.cottageId, cottageId),
        sql`${bookings.status} IN ('BOOKED', 'BLOCKED')`,
        gt(bookings.endDate, toUtcDay(from)),
      ),
    )
    .orderBy(asc(bookings.startDate));
}
