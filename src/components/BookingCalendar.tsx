import { useMemo, useState } from "react";
import { ru } from "date-fns/locale";
import { trpc } from "@/providers/trpc";
import { LeadForm } from "@/components/LeadForm";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DateRange } from "react-day-picker";

// Календарь на карточке объекта — выбор диапазона «заезд → выезд» той же
// логикой, что и в админке: первый клик — заезд, второй — выезд. Диапазон
// полуоткрытый [зaeзд, выезд): день выезда остаётся свободным. Занятые
// (BOOKED/BLOCKED) и прошедшие даты не кликабельны. Кнопка открывает заявку
// с выбранными датами — бронь подтверждает менеджер в админке.

function startOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function addUtcMonths(d: Date, n: number): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
}

function addUtcDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + n);
  return r;
}

// Клик по календарю даёт local midnight — в заявку уходит UTC-день,
// это соглашение всего проекта (см. LeadForm и бэкенд).
function toUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

function pluralNights(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return "ночей";
  switch (n % 10) {
    case 1:
      return "ночь";
    case 2:
    case 3:
    case 4:
      return "ночи";
    default:
      return "ночей";
  }
}

export function BookingCalendar({
  cottageId,
  cottageTitle,
}: {
  cottageId: number;
  cottageTitle: string;
}) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [range, setRange] = useState<DateRange | undefined>();
  const [notice, setNotice] = useState<string | null>(null);
  const [request, setRequest] = useState<{
    checkIn: Date;
    checkOut: Date;
  } | null>(null);

  // Запрашиваем окно вокруг видимого месяца, чтобы навигация не дёргала кэш
  const from = addUtcMonths(month, -1);
  const to = addUtcMonths(month, 3);

  const { data: rows = [], isLoading } = trpc.booking.listByProperty.useQuery(
    { cottageId, from, to },
    { staleTime: 60_000 },
  );

  const today = useMemo(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }, []);

  // endDate в БД эксклюзивный: бронь 10→13 закрашивает 10, 11, 12
  const busyRows = rows.filter(
    (r) => r.status === "BOOKED" || r.status === "BLOCKED",
  );
  const bookedRanges: DateRange[] = busyRows.map((r) => ({
    from: r.startDate,
    to: addUtcDays(r.endDate, -1),
  }));

  // В v9 первый клик даёт {from, to: from} — это «выбран только заезд»;
  // полный диапазон — только когда to строго позже from.
  const rangeFrom = range?.from;
  const rangeTo =
    range?.to && rangeFrom && range.to.getTime() > rangeFrom.getTime()
      ? range.to
      : undefined;
  const hasRange = !!rangeFrom && !!rangeTo;

  const nights = hasRange
    ? Math.round((rangeTo.getTime() - rangeFrom.getTime()) / 86_400_000)
    : 0;

  const onSelectRange = (r: DateRange | undefined) => {
    setNotice(null);
    setRange(r);
  };

  // Заявка: checkIn = заезд, checkOut = выезд (эксклюзивно, день свободен).
  // Если выбран только заезд — заявка на одни сутки, как раньше по клику.
  const openRequest = () => {
    if (!range?.from) return;
    const checkIn = toUtcDay(range.from);
    const checkOut =
      range.to && range.to.getTime() > range.from.getTime()
        ? toUtcDay(range.to)
        : addUtcDays(checkIn, 1);
    const conflict = busyRows.find(
      (r) => r.startDate < checkOut && r.endDate > checkIn,
    );
    if (conflict) {
      setNotice(
        "Выбранный диапазон пересекается с занятыми датами. Выберите другие дни.",
      );
      return;
    }
    setRequest({ checkIn, checkOut });
  };

  return (
    <div className="w-full">
      <Calendar
        mode="range"
        className="w-full [--cell-size:2.8rem]"
        locale={ru}
        classNames={{
          caption_label:
            "select-none font-display text-base font-semibold capitalize",
        }}
        month={month}
        onMonthChange={(m) => setMonth(startOfMonth(m))}
        selected={range}
        onSelect={onSelectRange}
        excludeDisabled
        disabled={[...bookedRanges, { before: today }]}
        modifiers={{
          booked: bookedRanges,
          past: { before: today },
        }}
        modifiersClassNames={{
          booked:
            "bg-red-700 !text-white hover:bg-red-700 rounded-md aria-selected:bg-red-700",
          past: "text-[#1f1f1f]/30 line-through",
        }}
      />
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#1f1f1f]/60">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-3 w-3 bg-red-700" /> Занято
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-3 w-3 border border-[#e3e7e4] bg-white" />{" "}
          Свободно
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-3 w-3 bg-[#1f1f1f]/15" /> Прошедшие
          даты
        </span>
        {isLoading && <span>Обновляем календарь…</span>}
      </div>

      <p className="mt-4 text-sm text-[#1f1f1f]/70">
        {rangeFrom ? (
          hasRange ? (
            <>
              {rangeFrom.toLocaleDateString("ru-RU")} —{" "}
              {rangeTo.toLocaleDateString("ru-RU")} · {nights}{" "}
              {pluralNights(nights)}. День выезда остаётся свободным.
            </>
          ) : (
            <>
              Заезд: {rangeFrom.toLocaleDateString("ru-RU")} — теперь выберите
              дату выезда на календаре
            </>
          )
        ) : (
          "Первый клик по календарю — дата заезда, второй — дата выезда."
        )}
      </p>

      {notice && (
        <p className="mt-3 border border-red-700/30 bg-red-700/5 px-3 py-2 text-xs text-red-700">
          {notice}
        </p>
      )}

      {range?.from && (
        <div className="mt-3 flex items-center gap-2">
          <button onClick={openRequest} className="btn-brand flex-1">
            {hasRange
              ? `Оформить заявку на ${nights} ${pluralNights(nights)}`
              : "Оформить заявку на одни сутки"}
          </button>
          <button
            onClick={() => {
              setNotice(null);
              setRange(undefined);
            }}
            className="border border-[#1f1f1f]/20 px-3 py-2 text-sm hover:border-[#1f7567]"
          >
            Сбросить
          </button>
        </div>
      )}

      <Dialog
        open={request != null}
        onOpenChange={(open) => {
          if (!open) setRequest(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">
              Заявка на бронирование
            </DialogTitle>
          </DialogHeader>
          {request && (
            <LeadForm
              cottageId={cottageId}
              cottageTitle={cottageTitle}
              initialCheckIn={request.checkIn}
              initialCheckOut={request.checkOut}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
