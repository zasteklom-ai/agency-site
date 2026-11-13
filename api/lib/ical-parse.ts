import ICAL from "ical.js";
import { addDays, utcDay } from "./date-utils";

// Нормализованное all-day событие из внешнего .ics.
export interface ParsedIcalEvent {
  uid: string;
  summary: string | null;
  // Полуоткрытый интервал [startDay, endDayExclusive) в днях UTC:
  // бронь 10→13 занимает ночи 10, 11, 12 (RFC 5545, DTEND эксклюзивен).
  startDay: Date;
  endDayExclusive: Date;
}

export interface ParseResult {
  events: ParsedIcalEvent[];
  skippedNoUid: number;
}

// Парсим внешние .ics (Авито/ЦИАН). Источники (AVITO/CIAN/MANUAL/ICAL)
// обязательны для корректного merge — merge-логика живёт в ical-sync.ts.
// Повторяющиеся события (RRULE) не разворачиваем: площадки отдают плоский
// список VEVENT; рекуррентные события пропускаем, чтобы не угадывать семантику.
export function parseIcal(text: string): ParseResult {
  const jcal: unknown = ICAL.parse(text);
  const comp = new ICAL.Component(jcal as never);
  const vevents = comp.getAllSubcomponents("vevent");

  const events: ParsedIcalEvent[] = [];
  const seen = new Set<string>();
  let skippedNoUid = 0;

  for (const vc of vevents) {
    if (vc.getFirstPropertyValue("rrule") != null) continue;

    const uid = vc.getFirstPropertyValue("uid");
    if (typeof uid !== "string" || !uid || seen.has(uid)) {
      skippedNoUid++;
      continue;
    }

    const ev = new ICAL.Event(vc as never);
    if (!ev.startDate) continue;
    const startDay = icalTimeToUtcDay(ev.startDate);

    // DTEND отсутствует — считаем однодневным событием
    const endDayExclusive = ev.endDate
      ? icalEndToExclusiveUtcDay(ev.endDate)
      : addDays(startDay, 1);

    if (endDayExclusive <= startDay) continue; // вырожденный интервал

    seen.add(uid);
    events.push({
      uid,
      summary: ev.summary ? String(ev.summary) : null,
      startDay,
      endDayExclusive,
    });
  }

  return { events, skippedNoUid };
}

// Берём календарную дату «как написано» в событии (wall time), без TZ-сдвигов:
// для посуточной аренды день в файле = занятый день.
function icalTimeToUtcDay(t: ICAL.Time): Date {
  return utcDay(t.year, t.month - 1, t.day);
}

function icalEndToExclusiveUtcDay(t: ICAL.Time): Date {
  // День DTEND — это день выезда: при посуточной гранулярности он свободен
  // и для DATE (RFC 5545), и для DATE-TIME независимо от времени выезда.
  return icalTimeToUtcDay(t);
}
