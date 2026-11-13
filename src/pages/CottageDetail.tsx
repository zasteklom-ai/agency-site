import { useState } from "react";
import { useParams, Link } from "react-router";
import { Helmet } from "react-helmet-async";
import { trpc } from "@/providers/trpc";
import { BookingCalendar } from "@/components/BookingCalendar";
import { CottageCard, formatPrice } from "@/components/CottageCard";
import { PhoneContact } from "@/components/PhoneContact";
import { parseVkVideoUrl, buildVkVideoEmbedUrl } from "@contracts/vk-video";
import {
  BedDouble,
  Users,
  Maximize,
  MapPin,
  Waves,
  Flame,
  Droplets,
  Sparkles,
  Target,
  ChevronLeft,
  ChevronRight,
  Check,
  Trees,
  Clapperboard,
  Play,
} from "lucide-react";

// ВАЖНО: проект — чистый SPA на Vite без SSR, поэтому title/description/OG
// видны поисковикам только частично (Google рендерит JS, Яндекс — хуже).
// Для полноценного SEO нужен React Router 7 framework mode или prerendering
// (vite-ssg / @prerenderer/rollup-plugin). Этот слой — максимум, что доступно
// в SPA: helmet-async обновляет <head> после загрузки данных с сервера.

// Город в предложном падеже для шаблона «посуточная аренда в {city}»
function cityIn(c: { address: string | null; district: string | null }): string {
  const s = `${c.address ?? ""} ${c.district ?? ""}`.toLowerCase();
  if (s.includes("петербург")) return "Санкт-Петербурге";
  if (s.includes("ленинградская")) return "Ленинградской области";
  return c.district ?? "Ленинградской области";
}

function cityPlain(c: { address: string | null; district: string | null }): string {
  const s = `${c.address ?? ""} ${c.district ?? ""}`.toLowerCase();
  if (s.includes("петербург")) return "Санкт-Петербург";
  return c.district ?? "Ленобласть";
}

// Description 150–160 символов: город + цена + ключевая особенность
function buildDescription(c: {
  title: string;
  address: string | null;
  district: string | null;
  bedrooms: number | null;
  totalArea: number | null;
  price: number | null;
  priceWeekday: number | null;
  hasBanya: boolean;
  hasPool: boolean;
  hasSauna: boolean;
}): string {
  const feature = c.hasPool
    ? "с бассейном"
    : c.hasBanya
      ? "с баней"
      : c.hasSauna
        ? "с сауной"
        : "для отдыха и праздников";
  const price = c.priceWeekday ?? c.price;
  const parts = [
    `Коттедж «${c.title}» ${feature}: ${c.bedrooms ?? "—"} спален, ${c.totalArea ?? "—"} м².`,
    price != null ? `От ${price.toLocaleString("ru-RU")} ₽/сутки.` : "",
    `Посуточная аренда в ${cityIn(c)} без комиссии.`,
  ].filter(Boolean);
  let desc = parts.join(" ");
  if (desc.length > 160) {
    desc = desc.slice(0, 157);
    const cut = desc.lastIndexOf(" ");
    desc = desc.slice(0, cut).replace(/[,;.]+$/, "") + "…";
  }
  return desc;
}

// Ключевая особенность для плашки в блоке характеристик — комбинации удобств
// в приоритете маркетинговой ценности (аналог «баня + бассейн = спа-комплекс»)
function keyFeature(c: {
  hasBanya: boolean;
  hasSauna: boolean;
  hasPool: boolean;
  hasKupel: boolean;
  hasBilliard: boolean;
  hasBbq: boolean;
}): { icon: typeof Flame; name: string } | null {
  if (c.hasPool && (c.hasBanya || c.hasSauna))
    return { icon: Waves, name: "Спа-комплекс" };
  if (c.hasBanya && c.hasKupel) return { icon: Flame, name: "Банный комплекс" };
  if (c.hasPool) return { icon: Waves, name: "Бассейн" };
  if (c.hasBanya && c.hasSauna) return { icon: Flame, name: "Баня и сауна" };
  if (c.hasBanya) return { icon: Flame, name: "Баня" };
  if (c.hasSauna) return { icon: Sparkles, name: "Сауна" };
  if (c.hasKupel) return { icon: Droplets, name: "Купель" };
  if (c.hasBilliard) return { icon: Target, name: "Бильярд" };
  if (c.hasBbq) return { icon: Flame, name: "Мангальная зона" };
  return null;
}

export default function CottageDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: cottage, isLoading } = trpc.cottages.byId.useQuery({
    id: Number(id),
  });
  const [photoIndex, setPhotoIndex] = useState(0);

  // Похожие объекты — внутренняя перелинковка по району
  const { data: similarRaw } = trpc.cottages.list.useQuery(
    { district: cottage?.district ?? undefined, limit: 7 },
    { enabled: !!cottage?.district, staleTime: 5 * 60_000 },
  );
  const similar = (similarRaw?.items ?? [])
    .filter((x) => x.id !== cottage?.id)
    .slice(0, 4);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-20">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#1f7567] border-t-transparent" />
      </div>
    );
  }

  if (!cottage) {
    return (
      <div className="container-site min-h-screen py-32 text-center">
        <h1 className="font-display text-3xl">Объект не найден</h1>
        <Link to="/catalog" className="btn-brand mt-8">
          Вернуться в каталог
        </Link>
      </div>
    );
  }

  const origin = window.location.origin;
  const canonicalUrl = `${origin}/cottage/${cottage.id}`;
  const ogImageUrl = `${origin}/api/og/${cottage.id}`;
  const pageTitle = `${cottage.title} — посуточная аренда в ${cityIn(cottage)} | Города Мира`;
  const pageDescription = buildDescription(cottage);

  const photos =
    cottage.photos.length > 0
      ? cottage.photos.map((p) => p.url)
      : ["/placeholder.jpg"];

  // Галерея: видеообзор идёт сразу после первого фото
  const videoRef = cottage.videoUrl ? parseVkVideoUrl(cottage.videoUrl) : null;
  const media: ({ type: "photo"; url: string } | { type: "video" })[] =
    photos.map((url) => ({ type: "photo" as const, url }));
  if (videoRef) {
    media.splice(1, 0, { type: "video" });
  }

  // JSON-LD (schema.org): LodgingBusiness + Offer + GeoCoordinates.
  // Фото ограничиваем шестью — иначе разметка раздувается до сотен килобайт.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: cottage.title,
    description: pageDescription,
    url: canonicalUrl,
    image: photos.slice(0, 6).map((url, i) => ({
      "@type": "ImageObject" as const,
      contentUrl: url.startsWith("http") ? url : `${origin}${url}`,
      name: `${cottage.title} — фото ${i + 1}`,
    })),
    address: {
      "@type": "PostalAddress",
      streetAddress: cottage.address ?? undefined,
      addressLocality: cityPlain(cottage),
      addressRegion: cottage.district ?? "Ленинградская область",
      addressCountry: "RU",
    },
    ...(cottage.lat != null && cottage.lng != null
      ? {
          geo: {
            "@type": "GeoCoordinates" as const,
            latitude: cottage.lat,
            longitude: cottage.lng,
          },
        }
      : {}),
    offers: {
      "@type": "Offer",
      price: cottage.priceWeekday ?? cottage.price ?? undefined,
      priceCurrency: "RUB",
      availability: "https://schema.org/InStock",
      url: canonicalUrl,
    },
  };

  const amenities = [
    cottage.hasBanya && { icon: Flame, label: "Баня" },
    cottage.hasSauna && { icon: Sparkles, label: "Сауна" },
    cottage.hasPool && { icon: Waves, label: "Бассейн" },
    cottage.hasKupel && { icon: Droplets, label: "Купель" },
    cottage.hasBilliard && { icon: Target, label: "Бильярд" },
    cottage.hasBbq && { icon: Flame, label: "Мангальная зона" },
  ].filter(Boolean) as { icon: typeof Flame; label: string }[];

  const feature = keyFeature(cottage);
  const specs = [
    cottage.bedrooms != null && { icon: BedDouble, label: "Спален", value: String(cottage.bedrooms) },
    cottage.beds != null && { icon: Users, label: "Спальных мест", value: String(cottage.beds) },
    cottage.totalArea != null && { icon: Maximize, label: "Площадь дома", value: `${cottage.totalArea} м²` },
    cottage.landArea != null && { icon: Trees, label: "Участок", value: `${cottage.landArea} сот.` },
    feature && { icon: feature.icon, label: "Особенность", value: feature.name },
  ].filter(Boolean) as { icon: typeof Flame; label: string; value: string }[];

  const imageAlt = `${cottage.title} — ${cityPlain(cottage)}`;

  return (
    <div className="min-h-screen pt-20">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Города Мира" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:locale" content="ru_RU" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={ogImageUrl} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      <div className="container-site py-8">
        <Link
          to="/catalog"
          className="inline-flex items-center gap-2 text-sm text-[#1f1f1f]/60 transition-colors hover:text-[#1f7567]"
        >
          <ChevronLeft size={16} /> Назад к каталогу
        </Link>

        <article className="mt-6 grid gap-10 lg:grid-cols-[1fr_420px]">
          {/* Левая колонка */}
          <div>
            {/* Галерея: фото + видеообзор после первого фото */}
            <div className="relative aspect-[16/10] overflow-hidden bg-[#e3e7e4]">
              {media[photoIndex].type === "video" && videoRef ? (
                <iframe
                  key="video"
                  src={buildVkVideoEmbedUrl(videoRef)}
                  title={`Видеообзор: ${cottage.title}`}
                  className="absolute inset-0 h-full w-full"
                  allow="encrypted-media; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <img
                  src={
                    media[photoIndex].type === "photo"
                      ? media[photoIndex].url
                      : photos[0]
                  }
                  alt={imageAlt}
                  loading="eager"
                  fetchPriority="high"
                  className="h-full w-full object-cover"
                />
              )}
              {media.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setPhotoIndex((photoIndex - 1 + media.length) % media.length)
                    }
                    className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center bg-black/50 text-white transition-colors hover:bg-[#45c1af] hover:text-[#141414]"
                    aria-label="Предыдущий материал"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => setPhotoIndex((photoIndex + 1) % media.length)}
                    className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center bg-black/50 text-white transition-colors hover:bg-[#45c1af] hover:text-[#141414]"
                    aria-label="Следующий материал"
                  >
                    <ChevronRight size={20} />
                  </button>
                  <div className="absolute bottom-4 right-4 bg-black/60 px-3 py-1 text-xs text-white">
                    {photoIndex + 1} / {media.length}
                  </div>
                </>
              )}
            </div>
            {media.length > 1 && (
              <div className="mt-3 grid grid-cols-6 gap-2">
                {media.slice(0, 6).map((item, i) => (
                  <button
                    key={item.type === "video" ? "video" : item.url}
                    onClick={() => setPhotoIndex(i)}
                    className={`relative aspect-[4/3] overflow-hidden border-2 transition-colors ${
                      i === photoIndex ? "border-[#1f7567]" : "border-transparent"
                    }`}
                  >
                    {item.type === "video" ? (
                      <span className="flex h-full w-full flex-col items-center justify-center gap-1 bg-[#141414] text-white">
                        <Play size={18} className="text-[#45c1af]" />
                        <span className="text-[10px] uppercase tracking-wider text-white/60">
                          Видео
                        </span>
                      </span>
                    ) : (
                      <img
                        src={item.url}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Краткая информация — под фото */}
            <div className="mt-6 bg-[#141414] p-7 text-white">
              <p className="text-xs uppercase tracking-[0.25em] text-[#45c1af]">
                {cottage.district ?? "Ленинградская область"}
              </p>
              <h1 className="font-display mt-2 text-2xl font-bold leading-snug">
                {cottage.title}
              </h1>
              <address className="mt-4 flex items-center gap-2 text-sm not-italic text-white/60">
                <MapPin size={14} className="shrink-0 text-[#45c1af]" />
                <span>{cottage.address}</span>
              </address>

              {specs.length > 0 && (
                // flex-wrap вместо grid с gap-px: у неполного ряда grid рисовал бы
                // пустые ячейки фоном контейнера (bg-white/10)
                <div className="mt-6 flex flex-wrap border-l border-t border-white/10">
                  {specs.map((s) => (
                    <div
                      key={s.label}
                      className="w-1/2 border-b border-r border-white/10 bg-[#1a1a1a] p-4 sm:w-1/4"
                    >
                      <s.icon size={18} className="text-[#45c1af]" />
                      <div className="font-display mt-2 text-lg">{s.value}</div>
                      <div className="text-xs text-white/50">{s.label}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-t border-white/10 pt-5">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-3xl font-bold text-[#45c1af]">
                      {formatPrice(cottage.price)}
                    </span>
                    <span className="text-sm text-white/50">/ сутки</span>
                  </div>
                  <p className="mt-2 max-w-md text-xs leading-relaxed text-white/40">
                    Точную стоимость на ваши даты уточняйте у менеджера — цена
                    зависит от дня недели и количества гостей.
                  </p>
                </div>
                {videoRef && (
                  <button
                    onClick={() =>
                      setPhotoIndex(media.findIndex((m) => m.type === "video"))
                    }
                    className="inline-flex items-center gap-2 border border-[#45c1af]/50 px-4 py-2.5 text-sm text-[#45c1af] transition-colors hover:bg-[#45c1af] hover:text-[#141414]"
                  >
                    <Clapperboard size={16} />
                    Смотреть видеообзор
                  </button>
                )}
              </div>
            </div>

            {/* Описание */}
            <div className="mt-10">
              <h2 className="font-display text-2xl font-bold text-[#1f1f1f]">
                Описание
              </h2>
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-[#1f1f1f]/70">
                {cottage.description}
              </p>
            </div>

            {/* Удобства */}
            {amenities.length > 0 && (
              <div className="mt-10">
                <h2 className="font-display text-2xl font-bold text-[#1f1f1f]">
                  Удобства
                </h2>
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {amenities.map((a) => (
                    <div
                      key={a.label}
                      className="flex items-center gap-3 border border-[#e3e7e4] bg-white px-4 py-3"
                    >
                      <a.icon size={18} className="shrink-0 text-[#1f7567]" />
                      <span className="text-sm">{a.label}</span>
                    </div>
                  ))}
                  {[
                    "Wi-Fi",
                    "Парковка",
                    "Постельное бельё",
                    "Посуда",
                    "Телевизор",
                  ].map((label) => (
                    <div
                      key={label}
                      className="flex items-center gap-3 border border-[#e3e7e4] bg-white px-4 py-3"
                    >
                      <Check size={18} className="shrink-0 text-[#1f7567]" />
                      <span className="text-sm">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Правая колонка — календарь занятости с формой заявки в диалоге */}
          <div>
            <div className="sticky top-32">
              {/* Календарь занятости: выбор диапазона заезд → выезд */}
              <div className="border border-[#e3e7e4] bg-white p-5">
                <h3 className="font-display text-lg font-bold text-[#1f1f1f]">
                  Календарь занятости
                </h3>
                <p className="mt-1 text-xs text-[#1f1f1f]/50">
                  Первый клик — дата заезда, второй — дата выезда. Затем
                  нажмите «Оформить заявку».
                </p>
                <div className="mt-4">
                  <BookingCalendar
                    cottageId={cottage.id}
                    cottageTitle={cottage.title}
                  />
                </div>
                <div className="mt-5 flex justify-center border-t border-[#e3e7e4] pt-4">
                  <PhoneContact variant="card" />
                </div>
              </div>
            </div>
          </div>
        </article>

        {/* Похожие объекты — внутренняя перелинковка по району */}
        {similar.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-2xl font-bold text-[#1f1f1f]">
              Похожие объекты{cottage.district ? ` — ${cottage.district}` : ""}
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {similar.map((s) => (
                <CottageCard key={s.id} cottage={s} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
