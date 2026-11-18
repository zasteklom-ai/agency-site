import { useState } from "react";
import { Link, useParams } from "react-router";
import {
  ArrowRight,
  Cake,
  Briefcase,
  Bus,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Croissant,
  Drone,
  Droplets,
  Flower,
  Heart,
  Lightbulb,
  MapPin,
  Mic,
  Origami,
  PartyPopper,
  Play,
  Presentation,
  Sparkles,
  Volume2,
  type LucideIcon,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import { LeadForm } from "@/components/LeadForm";
import { VideoEmbed } from "@/components/VideoEmbed";
import { usePageMeta } from "@/hooks/usePageMeta";

const ICONS: Record<string, LucideIcon> = {
  heart: Heart,
  briefcase: Briefcase,
  cake: Cake,
  presentation: Presentation,
  "party-popper": PartyPopper,
  camera: Camera,
  mic: Mic,
  sparkles: Sparkles,
  lightbulb: Lightbulb,
  droplets: Droplets,
  origami: Origami,
  drone: Drone,
  croissant: Croissant,
  bus: Bus,
  flower: Flower,
  "volume-2": Volume2,
};

function Gallery({ photos }: { photos: { src: string; alt: string }[] }) {
  const [index, setIndex] = useState(0);
  if (photos.length === 0) return null;
  return (
    <div>
      <div className="relative aspect-[16/10] overflow-hidden bg-[#e3e7e4]">
        <img
          src={photos[index].src}
          alt={photos[index].alt}
          loading={index === 0 ? "eager" : "lazy"}
          className="h-full w-full object-cover"
        />
        {photos.length > 1 && (
          <>
            <button
              onClick={() =>
                setIndex((index - 1 + photos.length) % photos.length)
              }
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center bg-black/50 text-white transition-colors hover:bg-[#45c1af] hover:text-[#141414]"
              aria-label="Предыдущее фото"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setIndex((index + 1) % photos.length)}
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center bg-black/50 text-white transition-colors hover:bg-[#45c1af] hover:text-[#141414]"
              aria-label="Следующее фото"
            >
              <ChevronRight size={18} />
            </button>
            <div className="absolute bottom-3 right-3 bg-black/60 px-3 py-1 text-xs text-white">
              {index + 1} / {photos.length}
            </div>
          </>
        )}
      </div>
      {photos.length > 1 && (
        <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-5">
          {photos.map((photo, i) => (
            <button
              key={photo.src}
              onClick={() => setIndex(i)}
              className={`relative aspect-[4/3] overflow-hidden border-2 transition-colors ${
                i === index
                  ? "border-[#1f7567]"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
              aria-label={`Фото ${i + 1}`}
            >
              <img
                src={photo.src}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PartnerDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: partner, isLoading } = trpc.partners.bySlug.useQuery(
    { slug: slug ?? "" },
    { enabled: !!slug }
  );
  const [activeMenu, setActiveMenu] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  usePageMeta(
    partner?.metaTitle ?? "Партнёры — Города Мира",
    partner?.metaDescription ?? ""
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-20">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#1f7567] border-t-transparent" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="container-site min-h-screen py-32 text-center">
        <h1 className="font-display text-3xl">Площадка не найдена</h1>
        <Link to="/partners" className="btn-brand mt-8">
          Все партнёры
        </Link>
      </div>
    );
  }

  const content = partner.content;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EventVenue",
    name: `Загородный комплекс «${partner.name}»`,
    description: partner.metaDescription,
    url: `${typeof window !== "undefined" ? window.location.origin : ""}/partners/${partner.slug}`,
    image: [partner.heroImage],
    address: {
      "@type": "PostalAddress",
      addressRegion: "Ленинградская область",
      addressCountry: "RU",
    },
  };

  return (
    <div className="min-h-screen pt-20">
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>

      {/* Hero */}
      <section className="relative flex min-h-[82vh] items-end overflow-hidden">
        <img
          src={partner.heroImage}
          alt={partner.heroAlt}
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/45 to-[#141414]/20" />
        <div className="container-site relative pb-16 pt-40">
          <p className="mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/80">
            <MapPin size={14} className="text-[#45c1af]" />
            {partner.location}
          </p>
          <h1 className="font-display max-w-3xl text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
            «{partner.name}»
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
            {partner.tagline}. {partner.excerpt}
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a href="#zayavka" className="btn-brand">
              Забронировать дату
            </a>
            <a
              href="#zaly"
              className="btn-outline-brand !border-white/40 !text-white hover:!border-[#45c1af]"
            >
              Смотреть залы
            </a>
          </div>
        </div>
      </section>

      {/* Ключевые цифры */}
      {content.stats.length > 0 && (
        <section className="border-b border-[#e3e7e4] bg-white">
          <div className="container-site flex flex-wrap">
            {content.stats.map(s => (
              <div
                key={s.label}
                className="w-1/2 border-l border-[#e3e7e4] px-6 py-7 first:border-l-0 sm:w-1/4"
              >
                <div className="font-display text-2xl font-bold text-[#1f7567]">
                  {s.value}
                </div>
                <div className="mt-1 text-xs uppercase tracking-wider text-[#1f1f1f]/55">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* О площадке + видео */}
      <section className="py-20">
        <div className="container-site grid items-start gap-12 lg:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#1f7567]">
              Партнёр агентства
            </p>
            <h2 className="font-display mt-3 text-3xl font-bold text-[#1f1f1f] sm:text-4xl">
              {content.about.title}
            </h2>
            {content.about.paragraphs.map(text => (
              <p
                key={text.slice(0, 32)}
                className="mt-5 text-sm leading-relaxed text-[#1f1f1f]/70"
              >
                {text}
              </p>
            ))}
            <Link
              to="/partners"
              className="mt-8 inline-flex items-center gap-2 text-sm uppercase tracking-wider text-[#1f7567] transition-colors hover:text-[#185f54]"
            >
              <ChevronLeft size={16} /> Все партнёры
            </Link>

            {partner.videoUrl && (
              <div className="mt-10">
                <p className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-[#1f7567]">
                  <Play size={14} className="text-[#1f7567]" />
                  Видео о площадке
                </p>
                <div className="mt-4 border border-[#e3e7e4] bg-white p-2 shadow-sm">
                  <VideoEmbed
                    url={partner.videoUrl}
                    title={`«${partner.name}» — видео о площадке`}
                  />
                </div>
              </div>
            )}
          </div>
          <div>
            {partner.territoryPlan && (
              <div className="border border-[#e3e7e4] bg-white p-3 shadow-sm">
                <img
                  src={partner.territoryPlan}
                  alt={partner.territoryPlanAlt}
                  loading="lazy"
                  className="w-full"
                />
                <p className="px-2 py-2 text-center text-xs uppercase tracking-[0.2em] text-[#1f1f1f]/50">
                  План территории
                </p>
              </div>
            )}
            {content.territoryPhotos.map(photo => (
              <div key={photo.src} className="mt-4 overflow-hidden">
                <img
                  src={photo.src}
                  alt={photo.alt}
                  loading="lazy"
                  className="w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Банкетные залы */}
      {content.halls.length > 0 && (
        <section id="zaly" className="bg-[#f2f6f4] py-20">
          <div className="container-site">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.3em] text-[#1f7567]">
                {content.hallsTitle}
              </p>
              <h2 className="font-display mt-3 text-3xl font-bold text-[#1f1f1f] sm:text-4xl">
                Залы под любой праздник
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[#1f1f1f]/60">
                {content.hallsIntro}
              </p>
            </div>

            <div className="mt-14 space-y-16">
              {content.halls.map((hall, i) => (
                <article
                  key={hall.id}
                  className="grid items-start gap-10 lg:grid-cols-2"
                >
                  <div className={i % 2 === 1 ? "lg:order-2" : ""}>
                    <Gallery photos={hall.photos} />
                  </div>
                  <div className={i % 2 === 1 ? "lg:order-1" : ""}>
                    {hall.badge && (
                      <span className="inline-block border border-[#1f7567]/40 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[#1f7567]">
                        {hall.badge}
                      </span>
                    )}
                    <h3 className="font-display mt-3 text-2xl font-bold text-[#1f1f1f] sm:text-3xl">
                      {hall.name}
                    </h3>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <span className="bg-[#1f7567] px-4 py-2 text-xs uppercase tracking-wider text-white">
                        Банкет до {hall.banquet} гостей
                      </span>
                      <span className="border border-[#1f7567]/40 px-4 py-2 text-xs uppercase tracking-wider text-[#1f7567]">
                        Фуршет до {hall.buffet}
                      </span>
                    </div>
                    <p className="mt-5 text-sm font-medium leading-relaxed text-[#1f1f1f]/80">
                      {hall.lead}
                    </p>
                    {hall.description.map(text => (
                      <p
                        key={text.slice(0, 32)}
                        className="mt-3 text-sm leading-relaxed text-[#1f1f1f]/65"
                      >
                        {text}
                      </p>
                    ))}
                    <ul className="mt-6 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
                      {hall.features.map(f => (
                        <li
                          key={f}
                          className="flex items-start gap-2.5 text-sm text-[#1f1f1f]/75"
                        >
                          <Check
                            size={16}
                            className="mt-0.5 shrink-0 text-[#1f7567]"
                          />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Банкетное меню */}
      {(content.menus ?? []).length > 0 && (
        <section className="py-20">
          <div className="container-site">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.3em] text-[#1f7567]">
                {content.menusTitle}
              </p>
              <h2 className="font-display mt-3 text-3xl font-bold text-[#1f1f1f] sm:text-4xl">
                Застолье под формат праздника
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[#1f1f1f]/60">
                {content.menusIntro}
              </p>
            </div>

            {/* Кнопка раскрытия меню */}
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={() => setMenuOpen(v => !v)}
                aria-expanded={menuOpen}
                className="btn-outline-brand"
              >
                {menuOpen ? "Свернуть" : "Подробнее"}
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-500 ${
                    menuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>

            {/* Раскрывающийся блок меню */}
            <div
              className={`grid transition-[grid-template-rows] duration-700 ease-in-out ${
                menuOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <div
                  className={`transition-opacity duration-500 ${
                    menuOpen ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {/* Переключатель вариантов */}
                  <div className="mt-10 flex flex-wrap gap-3">
                    {(content.menus ?? []).map((m, i) => (
                      <button
                        key={m.id}
                        onClick={() => setActiveMenu(i)}
                        className={`border px-5 py-3 text-sm uppercase tracking-wider transition-colors ${
                          i === activeMenu
                            ? "border-[#1f7567] bg-[#1f7567] text-white"
                            : "border-[#1f1f1f]/20 bg-white text-[#1f1f1f]/70 hover:border-[#1f7567] hover:text-[#1f7567]"
                        }`}
                      >
                        {m.name} · {m.price}
                      </button>
                    ))}
                  </div>

                  {(() => {
                    const menu = (content.menus ?? [])[activeMenu];
                    if (!menu) return null;
                    return (
                      <div className="mx-auto mt-12 max-w-5xl">
                        <div className="mb-8 flex flex-wrap items-center justify-center gap-4">
                          <span className="h-px w-16 bg-[#1f7567]" />
                          <p className="font-display text-xl font-bold text-[#1f1f1f]">
                            {menu.name} — {menu.price}
                          </p>
                          <span className="h-px w-16 bg-[#1f7567]" />
                        </div>
                        {menu.note && (
                          <p className="mb-8 text-center text-sm text-[#1f1f1f]/50">
                            {menu.note}
                          </p>
                        )}

                        <div className="space-y-6">
                          {menu.sections.map((section, si) => (
                            <div
                              key={section.title}
                              className="border border-[#e3e7e4] bg-white p-5 shadow-sm sm:p-8"
                            >
                              <div className="flex items-center gap-4">
                                <span className="font-display flex h-10 w-10 shrink-0 items-center justify-center border border-[#1f7567]/50 text-sm text-[#1f7567]">
                                  {String(si + 1).padStart(2, "0")}
                                </span>
                                <h3 className="font-display text-lg font-bold uppercase tracking-wide text-[#1f1f1f] sm:text-xl">
                                  {section.title}
                                </h3>
                                <span className="h-px flex-1 bg-[#e3e7e4]" />
                              </div>
                              <ul className="mt-6 grid gap-x-10 gap-y-4 md:grid-cols-2">
                                {section.items.map(item => (
                                  <li
                                    key={item.name}
                                    className="text-sm leading-relaxed text-[#1f1f1f]/75"
                                  >
                                    <span className="flex items-baseline justify-between gap-3">
                                      <span className="font-medium text-[#1f1f1f]">
                                        {item.name}
                                      </span>
                                      {item.portion && (
                                        <span className="shrink-0 text-xs uppercase tracking-wider text-[#1f7567]">
                                          {item.portion}
                                        </span>
                                      )}
                                    </span>
                                    {item.description && (
                                      <span className="mt-0.5 block text-[#1f1f1f]/55">
                                        {item.description}
                                      </span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>

                        {content.menusNote && (
                          <p className="mt-10 text-center text-xs uppercase tracking-[0.25em] text-[#1f1f1f]/50">
                            {content.menusNote}
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Проживание */}
      {content.accommodation && (
        <section className="section-dark py-20">
          <div className="container-site grid items-start gap-12 lg:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#45c1af]">
                Проживание
              </p>
              <h2 className="font-display mt-3 text-3xl font-bold text-white sm:text-4xl">
                {content.accommodation.title}
              </h2>
              <p className="mt-4 text-sm font-medium leading-relaxed text-white/80">
                {content.accommodation.lead}
              </p>
              {content.accommodation.description.map(text => (
                <p
                  key={text.slice(0, 32)}
                  className="mt-4 text-sm leading-relaxed text-white/60"
                >
                  {text}
                </p>
              ))}
              <ul className="mt-6 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
                {content.accommodation.features.map(f => (
                  <li
                    key={f}
                    className="flex items-start gap-2.5 text-sm text-white/75"
                  >
                    <Check
                      size={16}
                      className="mt-0.5 shrink-0 text-[#45c1af]"
                    />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <Gallery photos={content.accommodation.photos} />
          </div>
        </section>
      )}

      {/* Форматы мероприятий */}
      {content.events.length > 0 && (
        <section className="py-20">
          <div className="container-site">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.3em] text-[#1f7567]">
                {content.eventsTitle}
              </p>
              <h2 className="font-display mt-3 text-3xl font-bold text-[#1f1f1f] sm:text-4xl">
                Площадка под ваш сценарий
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[#1f1f1f]/60">
                {content.eventsIntro}
              </p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {content.events.map(e => {
                const Icon = ICONS[e.icon] ?? Sparkles;
                return (
                  <article
                    key={e.title}
                    className="group border border-[#e3e7e4] bg-white transition-all hover:border-[#1f7567] hover:shadow-lg"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-[#e3e7e4]">
                      <img
                        src={e.photo.src}
                        alt={e.photo.alt}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-3">
                        <Icon size={22} className="shrink-0 text-[#1f7567]" />
                        <h3 className="font-display text-xl font-bold text-[#1f1f1f]">
                          {e.title}
                        </h3>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-[#1f1f1f]/65">
                        {e.description}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Дополнительные услуги */}
      {content.services.length > 0 && (
        <section className="bg-[#f2f6f4] py-20">
          <div className="container-site">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.3em] text-[#1f7567]">
                {content.servicesTitle}
              </p>
              <h2 className="font-display mt-3 text-3xl font-bold text-[#1f1f1f] sm:text-4xl">
                Праздник без забот
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[#1f1f1f]/60">
                {content.servicesIntro}
              </p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {content.services.map(s => {
                const Icon = ICONS[s.icon] ?? Sparkles;
                return (
                  <div
                    key={s.title}
                    className="border border-[#e3e7e4] bg-white p-7 transition-all hover:border-[#1f7567]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <Icon size={26} className="text-[#1f7567]" />
                      {s.price && (
                        <span className="bg-[#f2f6f4] px-3 py-1 text-xs font-medium text-[#1f7567]">
                          {s.price}
                        </span>
                      )}
                    </div>
                    <h3 className="font-display mt-4 text-lg font-bold text-[#1f1f1f]">
                      {s.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#1f1f1f]/60">
                      {s.description}
                    </p>
                  </div>
                );
              })}
            </div>
            {content.servicesNote && (
              <p className="mt-4 text-xs text-[#1f1f1f]/45">
                {content.servicesNote}
              </p>
            )}

            {content.servicesPhotos.length > 0 && (
              <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {content.servicesPhotos.map(photo => (
                  <div
                    key={photo.src}
                    className="group aspect-[4/3] overflow-hidden bg-[#e3e7e4]"
                  >
                    <img
                      src={photo.src}
                      alt={photo.alt}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Лид-форма */}
      <section id="zayavka" className="section-dark py-20">
        <div className="container-site grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
              Забронируем «{partner.name}»{" "}
              <span className="text-[#45c1af]">под ваши даты</span>
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/60">
              Оставьте заявку — менеджер проверит свободные даты, рассчитает
              банкет и проживание и забронирует площадку без предоплаты за
              подбор.
            </p>
            <ul className="mt-6 space-y-2.5">
              {[
                "Проверим занятость залов на нужные даты",
                "Соберём смету: зал, банкет, проживание, услуги",
                "Организуем просмотр площадки перед бронированием",
              ].map(t => (
                <li
                  key={t}
                  className="flex items-center gap-3 text-sm text-white/70"
                >
                  <Check size={16} className="shrink-0 text-[#45c1af]" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-[#1f1f1f] p-8 text-white sm:p-10">
            <LeadForm dark />
          </div>
        </div>
      </section>

      <div className="container-site flex flex-wrap items-center justify-between gap-4 py-10">
        <Link
          to="/partners"
          className="inline-flex items-center gap-2 text-sm uppercase tracking-wider text-[#1f7567] transition-colors hover:text-[#185f54]"
        >
          <ChevronLeft size={16} /> Все партнёры
        </Link>
        <Link
          to="/catalog"
          className="inline-flex items-center gap-2 text-sm uppercase tracking-wider text-[#1f7567] transition-colors hover:text-[#185f54]"
        >
          Каталог коттеджей <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
