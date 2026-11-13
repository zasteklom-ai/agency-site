import { useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router";
import { ru } from "date-fns/locale";
import { trpc } from "@/providers/trpc";
import { ADMIN_TOKEN_KEY } from "@/lib/admin-token";
import { Calendar } from "@/components/ui/calendar";
import type { DateRange } from "react-day-picker";
import { ChevronLeft, Copy, Check, RefreshCw } from "lucide-react";

// В админке — полное редактирование через tRPC-мутации.
// Авторизация — тот же gm_admin_token из sessionStorage (отправляется как
// Bearer заголовок, см. providers/trpc.tsx); без токена — на страницу логина.
// Календарь работает как на странице объекта, но в режиме диапазона:
// первый клик — дата заезда, второй — дата выезда. Диапазон полуоткрытый
// [зaeзд, выезд) — в календаре закрываются только даты заселения,
// день выезда остаётся свободным для заезда следующего гостя.

type Status = "BOOKED" | "BLOCKED" | "AVAILABLE";

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

function fmtRange(from: Date, toExclusive: Date): string {
  const f = from.toLocaleDateString("ru-RU", { timeZone: "UTC" });
  const t = addUtcDays(toExclusive, -1).toLocaleDateString("ru-RU", {
    timeZone: "UTC",
  });
  return f === t ? f : `${f} — ${t}`;
}

// Поля «заезд/выезд» оперируют локальными датами, как и дни календаря
// (клик даёт local midnight; в БД уходит UTC-день — см. saveRange).
function toInputDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fromInputDate(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
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

const STATUS_LABEL: Record<string, string> = {
  BOOKED: "Бронь",
  BLOCKED: "Закрыто",
  AVAILABLE: "Цена (доступно)",
  CANCELLED: "Отменено",
};

const SOURCE_LABEL: Record<string, string> = {
  MANUAL: "Вручную",
  AVITO: "Авито",
  CIAN: "ЦИАН",
  ICAL: "iCal",
};

export default function AdminCottageCalendar() {
  const { id } = useParams<{ id: string }>();
  const cottageId = Number(id);
  const [token] = useState(() => sessionStorage.getItem(ADMIN_TOKEN_KEY) ?? "");

  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [range, setRange] = useState<DateRange | undefined>();
  const [status, setStatus] = useState<Status>("BLOCKED");
  const [price, setPrice] = useState("");
  const [comment, setComment] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const { data: cottage } = trpc.cottages.byId.useQuery(
    { id: cottageId },
    { enabled: !!token && Number.isInteger(cottageId) }
  );
  const { data: rows = [] } = trpc.booking.listByProperty.useQuery(
    { cottageId, from: addUtcMonths(month, -3), to: addUtcMonths(month, 12) },
    {
      enabled: !!token && Number.isInteger(cottageId),
      staleTime: 30_000,
    }
  );
  const settings = trpc.ical.getSettings.useQuery(
    { cottageId },
    { enabled: !!token && Number.isInteger(cottageId) }
  );

  const upsert = trpc.booking.upsert.useMutation({
    onSuccess: async () => {
      setNotice("Сохранено");
      setRange(undefined);
      await utils.booking.listByProperty.invalidate({ cottageId });
    },
    onError: e => setNotice(e.message),
  });
  const deleteRange = trpc.booking.deleteRange.useMutation({
    onSuccess: async r => {
      setNotice(`Освобождено записей: ${r.cancelled}`);
      setRange(undefined);
      await utils.booking.listByProperty.invalidate({ cottageId });
    },
    onError: e => setNotice(e.message),
  });
  const saveIcal = trpc.ical.saveSettings.useMutation({
    onSuccess: async () => {
      setNotice("Настройки iCal сохранены");
      await utils.ical.getSettings.invalidate({ cottageId });
    },
    onError: e => setNotice(e.message),
  });
  const syncNow = trpc.ical.syncProperty.useMutation({
    onSuccess: async r => {
      const parts = r.results.map(
        x =>
          `${x.source}: новых ${x.created}, обновлено ${x.updated}, отменено ${x.cancelled}` +
          (x.skippedManualConflicts
            ? `, пропущено (конфликт с ручной бронью) ${x.skippedManualConflicts}`
            : "") +
          (x.error ? `, ошибка: ${x.error}` : "")
      );
      setNotice(parts.join(" · ") || "Нечего синхронизировать");
      await utils.booking.listByProperty.invalidate({ cottageId });
    },
    onError: e => setNotice(e.message),
  });

  const [avitoUrl, setAvitoUrl] = useState<string | null>(null);
  const [cianUrl, setCianUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const activeRows = useMemo(
    () =>
      rows.filter(
        r => r.status !== "CANCELLED" && r.endDate > addUtcMonths(month, -3)
      ),
    [rows, month]
  );

  const today = useMemo(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }, []);

  if (!token) return <Navigate to="/admin" replace />;

  // Ленивая подстановка URL в поля после загрузки настроек
  if (settings.data && avitoUrl === null) {
    setAvitoUrl(settings.data.importAvitoUrl ?? "");
    setCianUrl(settings.data.importCianUrl ?? "");
  }

  const onSelectRange = (r: DateRange | undefined) => {
    setNotice(null);
    setRange(r);
  };

  const onCheckInChange = (s: string) => {
    setNotice(null);
    const from = fromInputDate(s);
    if (!from) {
      setRange(undefined);
      return;
    }
    setMonth(startOfMonth(from));
    setRange(r =>
      r?.to && r.to > from ? { from, to: r.to } : { from, to: undefined }
    );
  };

  const onCheckOutChange = (s: string) => {
    setNotice(null);
    const to = fromInputDate(s);
    if (!to) {
      setRange(r => (r?.from ? { from: r.from, to: undefined } : undefined));
      return;
    }
    if (!range?.from) {
      setNotice("Сначала выберите дату заезда");
      return;
    }
    if (to <= range.from) {
      setNotice("Дата выезда должна быть позже даты заезда");
      return;
    }
    setRange({ from: range.from, to });
  };

  const nights =
    range?.from && range?.to
      ? Math.round((range.to.getTime() - range.from.getTime()) / 86_400_000)
      : 0;

  const saveRange = () => {
    setNotice(null);
    if (!range?.from) {
      setNotice("Выберите даты на календаре");
      return;
    }
    const startDate = new Date(
      Date.UTC(
        range.from.getFullYear(),
        range.from.getMonth(),
        range.from.getDate()
      )
    );
    // UI-диапазон инклюзивен, в БД end эксклюзивен — день выезда свободен
    const lastDay = range.to ?? range.from;
    const endDate = addUtcDays(
      new Date(
        Date.UTC(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate())
      ),
      1
    );
    upsert.mutate({
      cottageId,
      startDate,
      endDate,
      status,
      priceOverride: price ? Math.round(Number(price)) : null,
      comment: comment || undefined,
    });
  };

  const clearRange = () => {
    setNotice(null);
    if (!range?.from) {
      setNotice("Выберите даты на календаре");
      return;
    }
    const startDate = new Date(
      Date.UTC(
        range.from.getFullYear(),
        range.from.getMonth(),
        range.from.getDate()
      )
    );
    const lastDay = range.to ?? range.from;
    const endDate = addUtcDays(
      new Date(
        Date.UTC(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate())
      ),
      1
    );
    deleteRange.mutate({ cottageId, startDate, endDate });
  };

  const monthRange = () => {
    const start = month;
    const end = addUtcMonths(month, 1);
    return { start, end };
  };

  const inputCls =
    "w-full border border-[#e3e7e4] bg-white px-3 py-2 text-sm outline-none focus:border-[#1f7567]";

  const bookedRanges: DateRange[] = activeRows
    .filter(r => r.status === "BOOKED")
    .map(r => ({ from: r.startDate, to: addUtcDays(r.endDate, -1) }));
  const blockedRanges: DateRange[] = activeRows
    .filter(r => r.status === "BLOCKED")
    .map(r => ({ from: r.startDate, to: addUtcDays(r.endDate, -1) }));
  const pricedRanges: DateRange[] = activeRows
    .filter(r => r.status === "AVAILABLE")
    .map(r => ({ from: r.startDate, to: addUtcDays(r.endDate, -1) }));

  return (
    <div className="min-h-screen bg-[#eef2ef] py-10">
      <div className="container-site">
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-sm text-[#1f1f1f]/60 hover:text-[#1f7567]"
        >
          <ChevronLeft size={16} /> Назад в админку
        </Link>
        <h1 className="font-display mt-4 text-3xl font-bold">
          Календарь: {cottage?.title ?? `объект №${cottageId}`}
        </h1>

        {notice && (
          <p className="mt-4 border border-[#1f7567]/40 bg-white px-4 py-3 text-sm">
            {notice}
          </p>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[420px_1fr]">
          <div className="bg-white p-5">
            <Calendar
              mode="range"
              locale={ru}
              className="w-full [--cell-size:3rem]"
              selected={range}
              onSelect={onSelectRange}
              month={month}
              onMonthChange={m => setMonth(startOfMonth(m))}
              modifiers={{
                booked: bookedRanges,
                blocked: blockedRanges,
                priced: pricedRanges,
                past: { before: today },
              }}
              modifiersClassNames={{
                booked:
                  "bg-red-700 !text-white hover:bg-red-700 rounded-md aria-selected:bg-red-700",
                blocked:
                  "bg-amber-700 !text-white hover:bg-amber-700 rounded-md aria-selected:bg-amber-700",
                priced:
                  "bg-sky-700 !text-white hover:bg-sky-700 rounded-md aria-selected:bg-sky-700",
                past: "text-[#1f1f1f]/30 line-through",
              }}
              classNames={{
                caption_label:
                  "select-none font-display text-base font-semibold capitalize",
              }}
            />
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#1f1f1f]/60">
              <span className="inline-flex items-center gap-2">
                <span className="inline-block h-3 w-3 bg-red-700" /> Бронь
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="inline-block h-3 w-3 bg-amber-700" /> Закрыто
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="inline-block h-3 w-3 bg-sky-700" /> Цена
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="inline-block h-3 w-3 bg-[#1f1f1f]/15" />{" "}
                Прошедшие даты
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <label className="text-xs text-[#1f1f1f]/60">
                Дата заезда
                <input
                  type="date"
                  value={range?.from ? toInputDate(range.from) : ""}
                  onChange={e => onCheckInChange(e.target.value)}
                  className={inputCls}
                />
              </label>
              <label className="text-xs text-[#1f1f1f]/60">
                Дата выезда
                <input
                  type="date"
                  value={range?.to ? toInputDate(range.to) : ""}
                  onChange={e => onCheckOutChange(e.target.value)}
                  className={inputCls}
                />
              </label>
            </div>
            <p className="mt-2 text-xs text-[#1f1f1f]/60">
              {range?.from ? (
                range.to ? (
                  <>
                    {range.from.toLocaleDateString("ru-RU")} —{" "}
                    {range.to.toLocaleDateString("ru-RU")} · {nights}{" "}
                    {pluralNights(nights)}. День выезда остаётся свободным.
                  </>
                ) : (
                  <>
                    Заезд: {range.from.toLocaleDateString("ru-RU")} — теперь
                    выберите дату выезда на календаре
                  </>
                )
              ) : (
                "Первый клик по календарю — дата заезда, второй — дата выезда."
              )}
            </p>

            <div className="mt-5 flex flex-col gap-3 border-t border-[#e3e7e4] pt-5">
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs text-[#1f1f1f]/60">
                  Статус
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as Status)}
                    className={inputCls}
                  >
                    <option value="BOOKED">Бронь</option>
                    <option value="BLOCKED">Закрыто (блок)</option>
                    <option value="AVAILABLE">Доступно + цена</option>
                  </select>
                </label>
                <label className="text-xs text-[#1f1f1f]/60">
                  Цена за ночь, ₽ (необязательно)
                  <input
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    type="number"
                    min={0}
                    placeholder="15000"
                    className={inputCls}
                  />
                </label>
              </div>
              <label className="text-xs text-[#1f1f1f]/60">
                Комментарий (например: «личное пользование владельца»)
                <input
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  maxLength={255}
                  className={inputCls}
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={saveRange}
                  disabled={upsert.isPending}
                  className="btn-brand disabled:opacity-50"
                >
                  {upsert.isPending
                    ? "Сохранение..."
                    : status === "BOOKED"
                      ? "Сохранить бронь"
                      : "Сохранить диапазон"}
                </button>
                <button
                  onClick={clearRange}
                  disabled={deleteRange.isPending}
                  className="border border-[#1f1f1f]/20 px-4 py-2 text-sm hover:border-[#1f7567]"
                >
                  Освободить диапазон
                </button>
                <button
                  onClick={() => {
                    const { start, end } = monthRange();
                    upsert.mutate({
                      cottageId,
                      startDate: start,
                      endDate: end,
                      status: "BLOCKED",
                      comment: "Блок месяца",
                    });
                  }}
                  className="border border-[#1f1f1f]/20 px-4 py-2 text-sm hover:border-[#1f7567]"
                >
                  Заблокировать месяц
                </button>
                <button
                  onClick={() => {
                    const { start, end } = monthRange();
                    deleteRange.mutate({
                      cottageId,
                      startDate: start,
                      endDate: end,
                    });
                  }}
                  className="border border-[#1f1f1f]/20 px-4 py-2 text-sm hover:border-[#1f7567]"
                >
                  Очистить месяц
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-white p-5">
              <h2 className="font-display text-xl font-bold">
                Записи календаря
              </h2>
              <table className="mt-4 w-full text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase text-[#1f1f1f]/50">
                    <th className="pb-2">Даты</th>
                    <th className="pb-2">Статус</th>
                    <th className="pb-2">Источник</th>
                    <th className="pb-2">Цена</th>
                    <th className="pb-2">Комментарий</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {activeRows.map(r => (
                    <tr key={r.id} className="border-t border-[#e3e7e4]">
                      <td className="py-2">
                        {fmtRange(r.startDate, r.endDate)}
                      </td>
                      <td className="py-2">{STATUS_LABEL[r.status]}</td>
                      <td className="py-2">{SOURCE_LABEL[r.source]}</td>
                      <td className="py-2">
                        {r.priceOverride != null
                          ? `${Number(r.priceOverride).toLocaleString("ru-RU")} ₽`
                          : "—"}
                      </td>
                      <td className="py-2 text-[#1f1f1f]/60">
                        {r.comment ?? "—"}
                      </td>
                      <td className="py-2 text-right">
                        {r.source === "MANUAL" && (
                          <button
                            onClick={() =>
                              deleteRange.mutate({
                                cottageId,
                                startDate: r.startDate,
                                endDate: r.endDate,
                              })
                            }
                            className="text-xs text-red-700 hover:underline"
                          >
                            Отменить
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {activeRows.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-6 text-center text-[#1f1f1f]/50"
                      >
                        Записей нет
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-white p-5">
              <h2 className="font-display text-xl font-bold">
                Синхронизация iCal (Авито / ЦИАН)
              </h2>
              <p className="mt-1 text-xs text-[#1f1f1f]/60">
                Импорт: укажите ссылки на .ics из кабинетов площадок — брони
                подтянутся автоматически (проверка каждые 15 минут). Экспорт:
                отдайте ссылку площадке, она будет забирать наши брони.
              </p>
              <div className="mt-4 flex flex-col gap-3">
                <label className="text-xs text-[#1f1f1f]/60">
                  URL импорта Авито
                  <input
                    value={avitoUrl ?? ""}
                    onChange={e => setAvitoUrl(e.target.value)}
                    placeholder="https://www.avito.ru/ical/..."
                    className={inputCls}
                  />
                </label>
                <label className="text-xs text-[#1f1f1f]/60">
                  URL импорта ЦИАН
                  <input
                    value={cianUrl ?? ""}
                    onChange={e => setCianUrl(e.target.value)}
                    placeholder="https://www.cian.ru/ical/..."
                    className={inputCls}
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() =>
                      saveIcal.mutate({
                        cottageId,
                        importAvitoUrl: avitoUrl?.trim() || null,
                        importCianUrl: cianUrl?.trim() || null,
                      })
                    }
                    disabled={saveIcal.isPending}
                    className="btn-brand disabled:opacity-50"
                  >
                    Сохранить настройки
                  </button>
                  <button
                    onClick={() => syncNow.mutate({ cottageId })}
                    disabled={syncNow.isPending}
                    className="inline-flex items-center gap-2 border border-[#1f1f1f]/20 px-4 py-2 text-sm hover:border-[#1f7567]"
                  >
                    <RefreshCw size={14} />{" "}
                    {syncNow.isPending
                      ? "Синхронизация..."
                      : "Синхронизировать сейчас"}
                  </button>
                </div>

                {settings.data?.exportUrl && (
                  <div className="mt-2 border border-[#e3e7e4] bg-[#eef2ef] p-3">
                    <p className="text-xs text-[#1f1f1f]/60">
                      Ссылка для экспорта (отдайте Авито/ЦИАН):
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <code className="flex-1 break-all text-xs">
                        {settings.data.exportUrl}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard
                            .writeText(settings.data.exportUrl)
                            .then(() => {
                              setCopied(true);
                              setTimeout(() => setCopied(false), 1500);
                            });
                        }}
                        className="shrink-0 border border-[#1f1f1f]/20 p-2 hover:border-[#1f7567]"
                        aria-label="Скопировать ссылку"
                      >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            "Сгенерировать новую ссылку? Старая перестанет работать на площадках."
                          )
                        ) {
                          saveIcal.mutate({
                            cottageId,
                            regenerateExportToken: true,
                          });
                        }
                      }}
                      className="mt-2 text-xs text-red-700 hover:underline"
                    >
                      Перегенерировать ссылку
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
