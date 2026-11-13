// Утилиты для работы с календарными датами броней.
// Все даты нормализуем к полуночи UTC и трактуем как «дневные маркеры»:
// бронь [start, end) занимает ночи start..end-1, день выезда свободен.
// Такое же соглашение использует RFC 5545 для all-day событий.

export function toUtcDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

export function utcDay(y: number, m0: number, d: number): Date {
  return new Date(Date.UTC(y, m0, d));
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + n);
  return r;
}

export function addMonths(d: Date, n: number): Date {
  const r = new Date(d);
  r.setUTCMonth(r.getUTCMonth() + n);
  return r;
}

export function startOfTodayUtc(): Date {
  return toUtcDay(new Date());
}

export function rangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function eachDayOfRange(
  start: Date,
  endExclusive: Date,
): Date[] {
  const out: Date[] = [];
  for (let d = toUtcDay(start); d < endExclusive; d = addDays(d, 1)) {
    out.push(d);
  }
  return out;
}

export function formatDayRu(d: Date): string {
  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
