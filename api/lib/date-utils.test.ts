import { describe, expect, it } from "vitest";
import {
  addDays,
  rangesOverlap,
  toUtcDay,
  utcDay,
} from "./date-utils";

// Правило «никакого овербукинга»: полуоткрытые интервалы [start, end).
// Бронь 10→13 занимает ночи 10, 11, 12; день 13 свободен и может быть
// заездом следующей брони.

describe("rangesOverlap", () => {
  const b = (d: number) => utcDay(2026, 10, d);

  it("соседние брони без общей ночи не пересекаются", () => {
    expect(rangesOverlap(b(5), b(10), b(10), b(15))).toBe(false);
    expect(rangesOverlap(b(10), b(15), b(5), b(10))).toBe(false);
  });

  it("пересечение на одну ночь — конфликт", () => {
    expect(rangesOverlap(b(5), b(10), b(9), b(15))).toBe(true);
    expect(rangesOverlap(b(9), b(15), b(5), b(10))).toBe(true);
  });

  it("полное вложение — конфликт", () => {
    expect(rangesOverlap(b(1), b(30), b(10), b(12))).toBe(true);
    expect(rangesOverlap(b(10), b(12), b(1), b(30))).toBe(true);
  });

  it("совпадающий диапазон — конфликт (кроме пути exact-update в upsert)", () => {
    expect(rangesOverlap(b(10), b(13), b(10), b(13))).toBe(true);
  });

  it("границы касания не считаются пересечением", () => {
    expect(rangesOverlap(b(1), b(2), b(2), b(3))).toBe(false);
  });
});

describe("toUtcDay / addDays", () => {
  it("нормализует время к полуночи UTC", () => {
    const d = toUtcDay(new Date("2026-11-10T18:30:00+03:00"));
    expect(d.toISOString()).toBe("2026-11-10T00:00:00.000Z");
  });

  it("addDays переходит через месяцы", () => {
    expect(addDays(utcDay(2026, 0, 31), 1).toISOString()).toBe(
      "2026-02-01T00:00:00.000Z",
    );
  });
});
