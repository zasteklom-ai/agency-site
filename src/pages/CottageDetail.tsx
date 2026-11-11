import { useState } from "react";
import { useParams, Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { LeadForm } from "@/components/LeadForm";
import { PhoneContact } from "@/components/PhoneContact";
import { formatPrice } from "@/components/CottageCard";
import { usePageMeta } from "@/hooks/usePageMeta";
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
} from "lucide-react";

export default function CottageDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: cottage, isLoading } = trpc.cottages.byId.useQuery({
    id: Number(id),
  });
  const [photoIndex, setPhotoIndex] = useState(0);

  usePageMeta(
    cottage
      ? `${cottage.title} — аренда посуточно, ${cottage.district || "Ленобласть"} | Города Мира`
      : "Коттедж посуточно — Города Мира",
    cottage
      ? `Аренда коттеджа посуточно: ${cottage.title}. ${cottage.bedrooms ?? "—"} спален, ${cottage.totalArea ?? "—"} м², от ${cottage.priceWeekday?.toLocaleString("ru-RU") ?? "—"} ₽/сутки. Бронирование у агентства «Города Мира».`
      : "Аренда коттеджа посуточно в СПб и Ленобласти для праздников и мероприятий.",
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-20">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#bb9c69] border-t-transparent" />
      </div>
    );
  }

  if (!cottage) {
    return (
      <div className="container-site min-h-screen py-32 text-center">
        <h1 className="font-display text-3xl">Объект не найден</h1>
        <Link to="/catalog" className="btn-gold mt-8">
          Вернуться в каталог
        </Link>
      </div>
    );
  }

  const photos =
    cottage.photos.length > 0
      ? cottage.photos.map((p) => p.url)
      : ["/placeholder.jpg"];
  const amenities = [
    cottage.hasBanya && { icon: Flame, label: "Баня" },
    cottage.hasSauna && { icon: Sparkles, label: "Сауна" },
    cottage.hasPool && { icon: Waves, label: "Бассейн" },
    cottage.hasKupel && { icon: Droplets, label: "Купель" },
    cottage.hasBilliard && { icon: Target, label: "Бильярд" },
    cottage.hasBbq && { icon: Flame, label: "Мангальная зона" },
  ].filter(Boolean) as { icon: typeof Flame; label: string }[];

  const specs = [
    cottage.bedrooms != null && { icon: BedDouble, label: "Спален", value: String(cottage.bedrooms) },
    cottage.beds != null && { icon: Users, label: "Спальных мест", value: String(cottage.beds) },
    cottage.totalArea != null && { icon: Maximize, label: "Площадь дома", value: `${cottage.totalArea} м²` },
    cottage.landArea != null && { icon: Trees, label: "Участок", value: `${cottage.landArea} сот.` },
  ].filter(Boolean) as { icon: typeof Flame; label: string; value: string }[];

  return (
    <div className="min-h-screen pt-20">
      <div className="container-site py-8">
        <Link
          to="/catalog"
          className="inline-flex items-center gap-2 text-sm text-[#1f1f1f]/60 transition-colors hover:text-[#bb9c69]"
        >
          <ChevronLeft size={16} /> Назад к каталогу
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_380px]">
          {/* Левая колонка */}
          <div>
            {/* Галерея */}
            <div className="relative aspect-[16/10] overflow-hidden bg-[#e8e2d5]">
              <img
                src={photos[photoIndex]}
                alt={cottage.title}
                className="h-full w-full object-cover"
              />
              {photos.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setPhotoIndex((photoIndex - 1 + photos.length) % photos.length)
                    }
                    className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center bg-black/50 text-white transition-colors hover:bg-[#bb9c69]"
                    aria-label="Предыдущее фото"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => setPhotoIndex((photoIndex + 1) % photos.length)}
                    className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center bg-black/50 text-white transition-colors hover:bg-[#bb9c69]"
                    aria-label="Следующее фото"
                  >
                    <ChevronRight size={20} />
                  </button>
                  <div className="absolute bottom-4 right-4 bg-black/60 px-3 py-1 text-xs text-white">
                    {photoIndex + 1} / {photos.length}
                  </div>
                </>
              )}
            </div>
            {photos.length > 1 && (
              <div className="mt-3 grid grid-cols-6 gap-2">
                {photos.slice(0, 6).map((url, i) => (
                  <button
                    key={url}
                    onClick={() => setPhotoIndex(i)}
                    className={`aspect-[4/3] overflow-hidden border-2 transition-colors ${
                      i === photoIndex ? "border-[#bb9c69]" : "border-transparent"
                    }`}
                  >
                    <img
                      src={url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

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
                      className="flex items-center gap-3 border border-[#e8e2d5] bg-white px-4 py-3"
                    >
                      <a.icon size={18} className="shrink-0 text-[#bb9c69]" />
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
                      className="flex items-center gap-3 border border-[#e8e2d5] bg-white px-4 py-3"
                    >
                      <Check size={18} className="shrink-0 text-[#bb9c69]" />
                      <span className="text-sm">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Правая колонка — карточка брони */}
          <div>
            <div className="sticky top-32">
              <div className="bg-[#141414] p-7 text-white">
                <p className="text-xs uppercase tracking-[0.25em] text-[#bb9c69]">
                  {cottage.district ?? "Ленинградская область"}
                </p>
                <h1 className="font-display mt-2 text-2xl font-bold leading-snug">
                  {cottage.title}
                </h1>
                <div className="mt-4 flex items-center gap-2 text-sm text-white/60">
                  <MapPin size={14} className="shrink-0 text-[#bb9c69]" />
                  <span>{cottage.address}</span>
                </div>

                {specs.length > 0 && (
                  <div className="mt-6 grid grid-cols-2 gap-px bg-white/10">
                    {specs.map((s) => (
                      <div key={s.label} className="bg-[#1a1a1a] p-4">
                        <s.icon size={18} className="text-[#bb9c69]" />
                        <div className="font-display mt-2 text-lg">{s.value}</div>
                        <div className="text-xs text-white/50">{s.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6 border-t border-white/10 pt-5">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-3xl font-bold text-[#bb9c69]">
                      {formatPrice(cottage.price)}
                    </span>
                    <span className="text-sm text-white/50">/ сутки</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-white/40">
                    Точную стоимость на ваши даты уточняйте у менеджера — цена
                    зависит от дня недели и количества гостей.
                  </p>
                </div>
              </div>

              <div className="border border-[#e8e2d5] bg-white p-7">
                <h3 className="font-display text-lg font-bold text-[#1f1f1f]">
                  Забронировать
                </h3>
                <div className="mt-4">
                  <LeadForm cottageId={cottage.id} cottageTitle={cottage.title} />
                </div>
                <div className="mt-4 text-center text-sm text-[#1f1f1f]/60">
                  или свяжитесь с нами:
                  <PhoneContact
                    variant="footer"
                    className="mt-1.5 flex justify-center font-semibold [&_button]:!text-[#bb9c69] hover:[&_button]:!text-[#a9874d]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
