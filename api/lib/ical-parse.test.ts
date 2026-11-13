import { describe, expect, it } from "vitest";
import { parseIcal } from "./ical-parse";

// Парсим внешние .ics каждые 15 минут. Ключевые гарантии, которые тут лочим:
// all-day DATE события → полуоткрытый интервал как у нас в БД;
// DATE-TIME выезд ровно в 00:00 — эксклюзивная граница, в 14:00 — округление вверх.

const ICS = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//avito//test//RU
BEGIN:VEVENT
UID:avito-1@x
DTSTAMP:20261101T000000Z
DTSTART;VALUE=DATE:20261110
DTEND;VALUE=DATE:20261113
SUMMARY:Бронь Авито
END:VEVENT
BEGIN:VEVENT
UID:avito-2@x
DTSTAMP:20261101T000000Z
DTSTART;VALUE=DATE:20261120
SUMMARY:Без DTEND — одна ночь
END:VEVENT
BEGIN:VEVENT
UID:avito-3@x
DTSTAMP:20261101T000000Z
DTSTART:20261125T140000Z
DTEND:20261127T120000Z
SUMMARY:Бронь с временем
END:VEVENT
BEGIN:VEVENT
DTSTAMP:20261101T000000Z
DTSTART;VALUE=DATE:20261201
DTEND;VALUE=DATE:20261203
SUMMARY:Без UID — пропускаем
END:VEVENT
END:VCALENDAR`;

describe("parseIcal", () => {
  const { events, skippedNoUid } = parseIcal(ICS);

  it("события без UID пропускаются и считаются", () => {
    expect(skippedNoUid).toBe(1);
    expect(events).toHaveLength(3);
  });

  it("all-day интервал остаётся полуоткрытым (RFC: DTEND эксклюзивен)", () => {
    const e = events.find((x) => x.uid === "avito-1@x");
    expect(e?.startDay.toISOString()).toBe("2026-11-10T00:00:00.000Z");
    expect(e?.endDayExclusive.toISOString()).toBe("2026-11-13T00:00:00.000Z");
  });

  it("событие без DTEND — одна ночь", () => {
    const e = events.find((x) => x.uid === "avito-2@x");
    expect(e?.startDay.toISOString()).toBe("2026-11-20T00:00:00.000Z");
    expect(e?.endDayExclusive.toISOString()).toBe("2026-11-21T00:00:00.000Z");
  });

  it("DATE-TIME: день выезда (DTEND) свободен", () => {
    const e = events.find((x) => x.uid === "avito-3@x");
    expect(e?.startDay.toISOString()).toBe("2026-11-25T00:00:00.000Z");
    expect(e?.endDayExclusive.toISOString()).toBe("2026-11-27T00:00:00.000Z");
  });

  it("DATE-TIME: выезд в 00:00 — эксклюзивная граница", () => {
    const ics = ICS.replace(
      "DTEND:20261127T120000Z",
      "DTEND:20261128T000000Z",
    );
    const r = parseIcal(ics);
    const e = r.events.find((x) => x.uid === "avito-3@x");
    expect(e?.endDayExclusive.toISOString()).toBe("2026-11-28T00:00:00.000Z");
  });
});
