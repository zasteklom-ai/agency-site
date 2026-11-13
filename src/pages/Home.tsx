import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { CottageCard } from "@/components/CottageCard";
import { LeadForm } from "@/components/LeadForm";
import { SOCIAL } from "@/config";
import { usePageMeta } from "@/hooks/usePageMeta";
import {
  Flame,
  Waves,
  Droplets,
  Sparkles,
  PartyPopper,
  Heart,
  Briefcase,
  Cake,
  ArrowRight,
  ShieldCheck,
  Clock,
  MapPin,
  Send,
} from "lucide-react";

function VkIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M13.16 17.5c-5.61 0-8.84-3.86-8.97-10.32h2.82c.1 4.73 2.18 6.73 3.83 7.14V7.18h2.65v4.08c1.63-.18 3.35-2.04 3.93-4.08h2.65c-.43 2.44-2.24 4.24-3.52 4.99 1.28.6 3.34 2.17 4.12 5.33h-2.92c-.62-1.94-2.17-3.44-4.3-3.72v3.72h-.29Z" />
    </svg>
  );
}

const EVENTS = [
  {
    icon: Heart,
    title: "Свадьбы",
    text: "Живописные усадьбы и банкетные залы для самого важного дня",
  },
  {
    icon: Cake,
    title: "Дни рождения",
    text: "Просторные дома с баней и бассейном для незабываемого праздника",
  },
  {
    icon: Briefcase,
    title: "Корпоративы",
    text: "Вместительные коттеджи для команд любого размера",
  },
  {
    icon: PartyPopper,
    title: "Вечеринки",
    text: "Уединённые локации, где можно отдыхать в своё удовольствие",
  },
];

const ADVANTAGES = [
  {
    icon: ShieldCheck,
    title: "Проверенные дома",
    text: "Каждый объект лично проверен нашей командой. Работаем только с надёжными собственниками.",
  },
  {
    icon: Clock,
    title: "Быстрый подбор",
    text: "Подберём подходящий коттедж под ваши даты и бюджет за 15 минут.",
  },
  {
    icon: Sparkles,
    title: "Праздник под ключ",
    text: "Поможем с организацией мероприятия: от кейтеринга до декора и музыки.",
  },
];

export default function Home() {
  const { data: featured } = trpc.cottages.featured.useQuery({ limit: 6 });
  const { data: stats } = trpc.cottages.list.useQuery({ limit: 1 });
  usePageMeta(
    "Города Мира — аренда коттеджей посуточно в СПб и Ленобласти для праздников",
    "Свадьбы, юбилеи, корпоративы за городом: 287 проверенных коттеджей с банями, бассейнами и купелями. Бесплатный подбор за 15 минут, банкетная служба.",
  );

  return (
    <div>
      {/* Hero */}
      <section className="relative flex min-h-[92vh] items-end overflow-hidden">
        <img
          src="/hero-v2.jpg"
          alt="Коттедж вечером"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/40 to-[#141414]/20" />
        <div className="container-site relative pb-20 pt-40">
          <p className="mb-4 text-xs uppercase tracking-[0.35em] text-white">
            Санкт-Петербург и Ленинградская область
          </p>
          <h1 className="font-display max-w-3xl text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
            Коттеджи посуточно для ваших{" "}
            <span className="text-[#45c1af]">праздников</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
            Свадьбы, юбилеи, корпоративы и отдых с близкими — {stats?.total ?? 290}{" "}
            проверенных домов с банями, бассейнами и купелями.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link to="/catalog" className="btn-brand">
              Смотреть каталог
            </Link>
            <a href="#lead" className="btn-outline-brand !text-white !border-white/40 hover:!border-[#45c1af]">
              Подобрать дом
            </a>
          </div>
        </div>
      </section>

      {/* Преимущества-фильтры быстрые */}
      <section className="border-b border-[#e3e7e4] bg-white py-8">
        <div className="container-site flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {[
            { icon: Flame, label: "С баней", q: "?banya=1" },
            { icon: Waves, label: "С бассейном", q: "?pool=1" },
            { icon: Droplets, label: "С купелью", q: "?kupel=1" },
            { icon: Sparkles, label: "Для свадеб", q: "" },
          ].map((f) => (
            <Link
              key={f.label}
              to={`/catalog${f.q}`}
              className="flex items-center gap-3 text-sm uppercase tracking-wider text-[#1f1f1f]/70 transition-colors hover:text-[#1f7567]"
            >
              <f.icon size={20} className="text-[#1f7567]" />
              {f.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Подборка */}
      <section className="py-20">
        <div className="container-site">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#1f7567]">
                Избранное
              </p>
              <h2 className="font-display mt-3 text-3xl font-bold text-[#1f1f1f] sm:text-4xl">
                Лучшие коттеджи
              </h2>
            </div>
            <Link
              to="/catalog"
              className="flex items-center gap-2 text-sm uppercase tracking-wider text-[#1f7567] transition-colors hover:text-[#185f54]"
            >
              Весь каталог <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured?.map((c) => (
              <CottageCard key={c.id} cottage={c} />
            ))}
          </div>
        </div>
      </section>

      {/* Мероприятия */}
      <section className="section-dark py-24">
        <div className="container-site">
          <p className="text-center text-xs uppercase tracking-[0.3em] text-[#45c1af]">
            Для любого события
          </p>
          <h2 className="font-display mx-auto mt-3 max-w-2xl text-center text-3xl font-bold sm:text-4xl">
            Организуем загородный отдых под ваш формат
          </h2>
          <div className="mt-14 grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {EVENTS.map((e) => (
              <div
                key={e.title}
                className="group bg-[#1a1a1a] p-8 transition-colors hover:bg-[#222]"
              >
                <e.icon
                  size={32}
                  className="text-[#45c1af] transition-transform group-hover:scale-110"
                />
                <h3 className="font-display mt-5 text-xl text-white">
                  {e.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-white/60">
                  {e.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Преимущества */}
      <section className="py-24">
        <div className="container-site">
          <div className="grid gap-12 lg:grid-cols-3">
            {ADVANTAGES.map((a, i) => (
              <div key={a.title} className="relative">
                <span className="font-display absolute -top-6 right-0 text-7xl font-bold text-[#1f7567]/10">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <a.icon size={36} className="text-[#1f7567]" />
                <h3 className="font-display mt-5 text-2xl text-[#1f1f1f]">
                  {a.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[#1f1f1f]/60">
                  {a.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Лид-форма */}
      <section id="lead" className="relative overflow-hidden py-24">
        <div className="absolute inset-0 bg-[#141414]" />
        <div className="container-site relative grid items-center gap-12 lg:grid-cols-2">
          <div className="text-white">
            <p className="text-xs uppercase tracking-[0.3em] text-[#45c1af]">
              Бесплатный подбор
            </p>
            <h2 className="font-display mt-3 text-3xl font-bold sm:text-4xl">
              Расскажите, какой дом вы ищете —{" "}
              <span className="text-[#45c1af]">найдём за 15 минут</span>
            </h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-white/60">
              Оставьте заявку, и наш менеджер подберёт свободные коттеджи под
              ваши даты, бюджет и пожелания. Покажем фото, расскажем о
              условиях, организуем просмотр.
            </p>
            <div className="mt-8 flex items-center gap-3 text-white/70">
              <MapPin size={18} className="text-[#45c1af]" />
              <span className="text-sm">
                Работаем по всей Ленинградской области
              </span>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={SOCIAL.vk}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 border border-white/20 px-4 py-2.5 text-xs uppercase tracking-wider text-white/80 transition-colors hover:border-[#45c1af] hover:text-[#45c1af]"
              >
                <VkIcon size={16} /> Мы ВКонтакте
              </a>
              <a
                href={SOCIAL.telegramChannel}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 border border-white/20 px-4 py-2.5 text-xs uppercase tracking-wider text-white/80 transition-colors hover:border-[#45c1af] hover:text-[#45c1af]"
              >
                <Send size={14} /> Telegram-канал
              </a>
            </div>
          </div>
          <div className="bg-[#1f1f1f] p-8 text-white sm:p-10">
            <LeadForm dark />
          </div>
        </div>
      </section>
    </div>
  );
}
