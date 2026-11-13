import { Link } from "react-router";
import { BedDouble, Users, Maximize, Waves, Flame, Droplets } from "lucide-react";

export interface CottageCardData {
  id: number;
  title: string;
  district: string | null;
  price: number | null;
  bedrooms: number | null;
  beds: number | null;
  totalArea: number | null;
  hasBanya: boolean;
  hasPool: boolean;
  hasKupel: boolean;
  hasSauna: boolean;
  photos: { url: string }[];
}

export function formatPrice(price: number | null) {
  if (!price) return "по запросу";
  return new Intl.NumberFormat("ru-RU").format(price) + " ₽";
}

export function CottageCard({ cottage }: { cottage: CottageCardData }) {
  const cover = cottage.photos[0]?.url ?? "/placeholder.jpg";

  return (
    <Link
      to={`/cottage/${cottage.id}`}
      className="group block overflow-hidden bg-white shadow-sm transition-all duration-300 hover:shadow-xl"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={cover}
          alt={cottage.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
          <span className="text-xs uppercase tracking-widest text-white/80">
            {cottage.district ?? "Ленинградская область"}
          </span>
          <div className="flex gap-2 text-white">
            {cottage.hasPool && <Waves size={16} />}
            {cottage.hasBanya && <Flame size={16} />}
            {cottage.hasKupel && <Droplets size={16} />}
          </div>
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-display text-lg leading-snug text-[#1f1f1f] transition-colors group-hover:text-[#1f7567]">
          {cottage.title}
        </h3>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#1f1f1f]/60">
          {cottage.bedrooms != null && (
            <span className="flex items-center gap-1.5">
              <BedDouble size={14} className="text-[#1f7567]" />
              {cottage.bedrooms} спален
            </span>
          )}
          {cottage.beds != null && (
            <span className="flex items-center gap-1.5">
              <Users size={14} className="text-[#1f7567]" />
              до {cottage.beds} мест
            </span>
          )}
          {cottage.totalArea != null && (
            <span className="flex items-center gap-1.5">
              <Maximize size={14} className="text-[#1f7567]" />
              {cottage.totalArea} м²
            </span>
          )}
        </div>
        <div className="mt-4 flex items-baseline justify-between border-t border-[#e3e7e4] pt-4">
          <span className="font-display text-xl font-bold text-[#1f7567]">
            {formatPrice(cottage.price)}
          </span>
          <span className="text-xs uppercase tracking-wider text-[#1f1f1f]/50">
            за сутки
          </span>
        </div>
      </div>
    </Link>
  );
}
