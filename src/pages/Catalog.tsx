import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { trpc } from "@/providers/trpc";
import { CottageCard } from "@/components/CottageCard";
import { usePageMeta } from "@/hooks/usePageMeta";
import { SlidersHorizontal, X, Search } from "lucide-react";

const PAGE_SIZE = 24;

interface Filters {
  district: string;
  minBedrooms: number | null;
  minBeds: number | null;
  minArea: number | null;
  maxPrice: number | null;
  hasBanya: boolean;
  hasPool: boolean;
  hasKupel: boolean;
  hasSauna: boolean;
  search: string;
  sort: "price_asc" | "price_desc" | "area_desc" | "newest";
}

const DEFAULT_FILTERS: Filters = {
  district: "",
  minBedrooms: null,
  minBeds: null,
  minArea: null,
  maxPrice: null,
  hasBanya: false,
  hasPool: false,
  hasKupel: false,
  hasSauna: false,
  search: "",
  sort: "newest",
};

export default function Catalog() {
  usePageMeta(
    "Каталог коттеджей посуточно в СПб и Ленобласти — Города Мира",
    "287 проверенных коттеджей для праздников: фильтры по бане, бассейну, купели, спальням, площади и району. Цены за сутки, фото, бронирование.",
  );
  const [params] = useSearchParams();
  const [page, setPage] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    ...DEFAULT_FILTERS,
    hasBanya: params.get("banya") === "1",
    hasPool: params.get("pool") === "1",
    hasKupel: params.get("kupel") === "1",
  });

  const { data: districts } = trpc.cottages.districts.useQuery();
  const queryInput = useMemo(
    () => ({
      district: filters.district || undefined,
      minBedrooms: filters.minBedrooms ?? undefined,
      minBeds: filters.minBeds ?? undefined,
      minArea: filters.minArea ?? undefined,
      maxPrice: filters.maxPrice ?? undefined,
      hasBanya: filters.hasBanya || undefined,
      hasPool: filters.hasPool || undefined,
      hasKupel: filters.hasKupel || undefined,
      hasSauna: filters.hasSauna || undefined,
      search: filters.search || undefined,
      sort: filters.sort,
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    }),
    [filters, page],
  );

  const { data, isLoading } = trpc.cottages.list.useQuery(queryInput);

  const set = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(0);
  };

  const reset = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(0);
  };

  const activeCount =
    (filters.district ? 1 : 0) +
    (filters.minBedrooms ? 1 : 0) +
    (filters.minBeds ? 1 : 0) +
    (filters.minArea ? 1 : 0) +
    (filters.maxPrice ? 1 : 0) +
    (filters.hasBanya ? 1 : 0) +
    (filters.hasPool ? 1 : 0) +
    (filters.hasKupel ? 1 : 0) +
    (filters.hasSauna ? 1 : 0);

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  const filterPanel = (
    <div className="flex flex-col gap-6">
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#1f1f1f]/60">
          Район
        </label>
        <select
          value={filters.district}
          onChange={(e) => set("district", e.target.value)}
          className="w-full border border-[#d8dcd9] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#1f7567]"
        >
          <option value="">Все районы</option>
          {districts?.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#1f1f1f]/60">
          Удобства
        </label>
        <div className="flex flex-col gap-2.5">
          {(
            [
              ["hasBanya", "Баня"],
              ["hasPool", "Бассейн"],
              ["hasKupel", "Купель"],
              ["hasSauna", "Сауна"],
            ] as const
          ).map(([key, label]) => (
            <label
              key={key}
              className="flex cursor-pointer items-center gap-3 text-sm"
            >
              <input
                type="checkbox"
                checked={filters[key]}
                onChange={(e) => set(key, e.target.checked)}
                className="h-4 w-4 accent-[#1f7567]"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#1f1f1f]/60">
          Спален от
        </label>
        <div className="flex flex-wrap gap-2">
          {[2, 3, 4, 5, 6].map((n) => (
            <button
              key={n}
              onClick={() =>
                set("minBedrooms", filters.minBedrooms === n ? null : n)
              }
              className={`border px-3.5 py-2 text-sm transition-colors ${
                filters.minBedrooms === n
                  ? "border-[#1f7567] bg-[#1f7567] text-white"
                  : "border-[#d8dcd9] hover:border-[#1f7567]"
              }`}
            >
              {n}+
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#1f1f1f]/60">
          Спальных мест от
        </label>
        <div className="flex flex-wrap gap-2">
          {[6, 10, 14, 20].map((n) => (
            <button
              key={n}
              onClick={() => set("minBeds", filters.minBeds === n ? null : n)}
              className={`border px-3.5 py-2 text-sm transition-colors ${
                filters.minBeds === n
                  ? "border-[#1f7567] bg-[#1f7567] text-white"
                  : "border-[#d8dcd9] hover:border-[#1f7567]"
              }`}
            >
              {n}+
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#1f1f1f]/60">
          Площадь от, м²
        </label>
        <input
          type="number"
          min={0}
          value={filters.minArea ?? ""}
          onChange={(e) =>
            set("minArea", e.target.value ? Number(e.target.value) : null)
          }
          placeholder="Например, 150"
          className="w-full border border-[#d8dcd9] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#1f7567]"
        />
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#1f1f1f]/60">
          Цена за сутки до, ₽
        </label>
        <input
          type="number"
          min={0}
          value={filters.maxPrice ?? ""}
          onChange={(e) =>
            set("maxPrice", e.target.value ? Number(e.target.value) : null)
          }
          placeholder="Например, 30000"
          className="w-full border border-[#d8dcd9] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#1f7567]"
        />
      </div>

      {activeCount > 0 && (
        <button
          onClick={reset}
          className="flex items-center justify-center gap-2 border border-[#d8dcd9] py-2.5 text-xs uppercase tracking-wider text-[#1f1f1f]/60 transition-colors hover:border-[#1f7567] hover:text-[#1f7567]"
        >
          <X size={14} /> Сбросить фильтры ({activeCount})
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen pt-20">
      {/* Заголовок */}
      <div className="bg-[#141414] py-14">
        <div className="container-site">
          <p className="text-xs uppercase tracking-[0.3em] text-[#1f7567]">
            {data ? `${data.total} объектов` : "Каталог"}
          </p>
          <h1 className="font-display mt-2 text-3xl font-bold text-white sm:text-4xl">
            Каталог коттеджей
          </h1>
        </div>
      </div>

      {/* Поиск + сортировка */}
      <div className="sticky top-20 z-30 border-b border-[#e8e2d5] bg-[#f2f6f4]/95 py-4 backdrop-blur">
        <div className="container-site flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1f1f1f]/40"
            />
            <input
              value={filters.search}
              onChange={(e) => set("search", e.target.value)}
              placeholder="Поиск по названию или адресу"
              className="w-full border border-[#d8dcd9] bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#1f7567]"
            />
          </div>
          <select
            value={filters.sort}
            onChange={(e) => set("sort", e.target.value as Filters["sort"])}
            className="border border-[#d8dcd9] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#1f7567]"
          >
            <option value="newest">Сначала новые</option>
            <option value="price_asc">Цена: по возрастанию</option>
            <option value="price_desc">Цена: по убыванию</option>
            <option value="area_desc">Площадь: по убыванию</option>
          </select>
          <button
            onClick={() => setMobileOpen(true)}
            className="flex items-center gap-2 border border-[#1f7567] px-4 py-2.5 text-sm text-[#1f7567] lg:hidden"
          >
            <SlidersHorizontal size={16} />
            Фильтры {activeCount > 0 && `(${activeCount})`}
          </button>
        </div>
      </div>

      <div className="container-site flex gap-8 py-10">
        {/* Сайдбар фильтров (десктоп) */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-40">{filterPanel}</div>
        </aside>

        {/* Сетка */}
        <div className="min-w-0 flex-1">
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-white">
                  <div className="aspect-[4/3] bg-[#e8e2d5]" />
                  <div className="space-y-3 p-5">
                    <div className="h-5 w-3/4 bg-[#e8e2d5]" />
                    <div className="h-4 w-1/2 bg-[#e8e2d5]" />
                  </div>
                </div>
              ))}
            </div>
          ) : data && data.items.length > 0 ? (
            <>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {data.items.map((c) => (
                  <CottageCard key={c.id} cottage={c} />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setPage(i);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className={`h-10 w-10 text-sm transition-colors ${
                        page === i
                          ? "bg-[#1f7567] text-white"
                          : "border border-[#d8dcd9] hover:border-[#1f7567]"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="py-20 text-center">
              <p className="font-display text-2xl text-[#1f1f1f]/60">
                Ничего не найдено
              </p>
              <p className="mt-2 text-sm text-[#1f1f1f]/40">
                Попробуйте изменить параметры фильтра
              </p>
              <button onClick={reset} className="btn-outline-brand mt-6">
                Сбросить фильтры
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Мобильные фильтры */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 top-0 overflow-y-auto bg-[#f2f6f4] p-6 pb-24">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">Фильтры</h2>
              <button
                onClick={() => setMobileOpen(false)}
                className="flex h-11 w-11 items-center justify-center"
                aria-label="Закрыть"
              >
                <X size={24} />
              </button>
            </div>
            {filterPanel}
            <button
              onClick={() => setMobileOpen(false)}
              className="btn-brand fixed bottom-0 left-0 right-0 w-full"
            >
              Показать {data?.total ?? ""} объектов
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
