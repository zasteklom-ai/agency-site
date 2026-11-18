import { Link } from "react-router";
import { ArrowRight, MapPin } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function Partners() {
  usePageMeta(
    "Партнёры — проверенные загородные площадки | Города Мира",
    "Партнёрские банкетные комплексы и базы отдыха: банкетные залы, проживание, кейтеринг и шоу-программа под ключ. Площадки проверены нашей командой.",
  );

  const { data: partners, isLoading } = trpc.partners.list.useQuery();

  return (
    <div className="min-h-screen pt-20">
      <div className="bg-[#141414] py-20">
        <div className="container-site">
          <p className="text-xs uppercase tracking-[0.3em] text-[#45c1af]">
            Партнёры агентства
          </p>
          <h1 className="font-display mt-3 max-w-3xl text-3xl font-bold text-white sm:text-5xl">
            Проверенные <span className="text-[#45c1af]">площадки</span> для ваших
            праздников
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/60">
            Мы лично знаем каждую площадку-партнёра: проверяем сервис, кухню и
            состояние объектов. Бронируйте банкетный зал, коттедж или весь
            комплекс через одного менеджера — без наценок и лишних звонков.
          </p>
        </div>
      </div>

      <div className="container-site py-16">
        {isLoading && (
          <div className="grid gap-8 md:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-96 animate-pulse bg-[#e3e7e4]" />
            ))}
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-2">
          {partners?.map((p) => (
            <article
              key={p.slug}
              className="group flex flex-col border border-[#e3e7e4] bg-white transition-all hover:border-[#1f7567] hover:shadow-lg"
            >
              <div className="relative aspect-[16/9] overflow-hidden bg-[#e3e7e4]">
                <img
                  src={p.cardImage}
                  alt={p.cardAlt}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#141414]/70 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/90">
                  <MapPin size={14} className="text-[#45c1af]" />
                  {p.location}
                </div>
              </div>

              <div className="flex flex-1 flex-col p-7">
                <h2 className="font-display text-2xl font-bold text-[#1f1f1f]">
                  «{p.name}»
                </h2>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[#1f7567]">
                  {p.tagline}
                </p>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-[#1f1f1f]/65">
                  {p.excerpt}
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {p.content.stats.map((s) => (
                    <span
                      key={s.label}
                      className="border border-[#e3e7e4] bg-[#f2f6f4] px-3 py-1.5 text-xs text-[#1f1f1f]/70"
                    >
                      <span className="font-display font-bold text-[#1f7567]">
                        {s.value}
                      </span>{" "}
                      {s.label}
                    </span>
                  ))}
                </div>

                <Link
                  to={`/partners/${p.slug}`}
                  className="btn-brand mt-7 inline-flex w-fit items-center gap-2"
                >
                  Подробнее <ArrowRight size={16} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
