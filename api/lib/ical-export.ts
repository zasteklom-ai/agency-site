import ical from "ical-generator";
import type { ICalCalendarMethod } from "ical-generator";
import type { bookings } from "@db/schema";
import type { InferSelectModel } from "drizzle-orm";

type BookingRow = InferSelectModel<typeof bookings>;

// Экспорт — Hono REST-роут, отдаём .ics по секретному URL.
// Avito и ЦИАН сами забирают этот файл; поэтому это plain HTTP, не tRPC.
// Берём default-export без именованных импортов: dev-сервер (tsx) резолвит
// CJS-сборку ical-generator, где named exports недоступны.
export function buildCottageIcs(
  cottage: { id: number; title: string },
  rows: BookingRow[],
  opts: { uidHost: string; calendarName?: string },
): string {
  const cal = ical({
    name: opts.calendarName ?? `Брони: ${cottage.title}`,
    // type-only каст: enum-значение PUBLISH === строке "PUBLISH", а именованный
    // runtime-импорт ломается в dev (tsx резолвит CJS-сборку без named exports)
    method: "PUBLISH" as ICalCalendarMethod,
    prodId: { company: "GorodaMira", product: "cottage-bookings" },
  });

  for (const b of rows) {
    if (b.status !== "BOOKED" && b.status !== "BLOCKED") continue;
    cal.createEvent({
      id: `booking-${b.id}@${opts.uidHost}`,
      allDay: true,
      // В БД интервал уже полуоткрытый [start, end) — совпадает с RFC 5545.
      start: b.startDate,
      end: b.endDate,
      summary:
        b.status === "BLOCKED"
          ? `Закрыто: ${cottage.title}`
          : `Бронь: ${cottage.title}`,
      description: b.comment ?? undefined,
      stamp: b.updatedAt,
    });
  }

  return cal.toString();
}
