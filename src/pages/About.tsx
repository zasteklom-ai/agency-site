import { Link } from "react-router";
import { Home, Users, Award, ShieldCheck, Send, BadgeCheck, Star } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { SOCIAL, REVIEW_LINKS } from "@/config";

function VkIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M13.16 17.5c-5.61 0-8.84-3.86-8.97-10.32h2.82c.1 4.73 2.18 6.73 3.83 7.14V7.18h2.65v4.08c1.63-.18 3.35-2.04 3.93-4.08h2.65c-.43 2.44-2.24 4.24-3.52 4.99 1.28.6 3.34 2.17 4.12 5.33h-2.92c-.62-1.94-2.17-3.44-4.3-3.72v3.72h-.29Z" />
    </svg>
  );
}

const STATS = [
  { value: "290+", label: "коттеджей в базе" },
  { value: "7 лет", label: "на рынке аренды" },
  { value: "5000+", label: "проведённых праздников" },
  { value: "24/7", label: "на связи с гостями" },
];

const PRINCIPLES = [
  {
    icon: Home,
    title: "Лично проверяем каждый дом",
    text: "Перед тем как добавить коттедж в каталог, мы выезжаем на объект: проверяем состояние, удобства и соответствие фотографиям.",
  },
  {
    icon: ShieldCheck,
    title: "Договор и прозрачные условия",
    text: "Работаем официально. Все условия бронирования фиксируются в договоре, без скрытых доплат.",
  },
  {
    icon: Users,
    title: "Сопровождаем на каждом этапе",
    text: "От подбора дома до выезда гостей — менеджер всегда на связи и поможет решить любой вопрос.",
  },
  {
    icon: Award,
    title: "Репутация, проверенная годами",
    text: "Большинство гостей возвращаются к нам снова и рекомендуют друзьям — это главная наша метрика.",
  },
];

export default function About() {
  usePageMeta(
    "О компании Города Мира — агентство посуточной аренды коттеджей в СПб",
    "7 лет на рынке загородной аренды, 290+ проверенных коттеджей, 5000+ праздников. Официальный договор, сопровождение 24/7, высший уровень сервиса.",
  );
  return (
    <div className="min-h-screen pt-20">
      <div className="bg-[#141414] py-20">
        <div className="container-site text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-[#bb9c69]">
            О компании
          </p>
          <h1 className="font-display mx-auto mt-3 max-w-3xl text-3xl font-bold text-white sm:text-5xl">
            «Города Мира» — ваш надёжный проводник в загородный отдых
          </h1>
        </div>
      </div>

      <section className="container-site py-16">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-bold text-[#1f1f1f]">
              Мы знаем о загородной аренде{" "}
              <span className="text-[#bb9c69]">всё</span>
            </h2>
            <div className="mt-6 space-y-4 text-sm leading-relaxed text-[#1f1f1f]/70">
              <p>
                Агентство «Города Мира» специализируется на посуточной аренде
                коттеджей в Санкт-Петербурге и Ленинградской области. За годы
                работы мы собрали базу из почти трёх сотен проверенных домов —
                от уютных дач для семейного уикенда до роскошных усадеб для
                свадеб на сотню гостей.
              </p>
              <p>
                Мы лично объехали каждый объект в нашем каталоге. Знаем, где
                самая жаркая баня, где бассейн с подогревом, а где участок
                выходит прямо к воде. И честно рассказываем обо всех нюансах —
                чтобы ваш праздник прошёл именно так, как вы задумали.
              </p>
              <p>
                Помимо аренды помогаем с организацией мероприятий: подскажем
                кейтеринг, декораторов, ведущих и музыкантов, с которыми
                работаем годами.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-px bg-[#e8e2d5]">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="flex flex-col items-center justify-center bg-white p-8 text-center"
              >
                <span className="font-display text-4xl font-bold text-[#bb9c69]">
                  {s.value}
                </span>
                <span className="mt-2 text-xs uppercase tracking-wider text-[#1f1f1f]/50">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-dark py-20">
        <div className="container-site">
          <h2 className="font-display text-center text-3xl font-bold text-white sm:text-4xl">
            Как мы <span className="text-[#bb9c69]">работаем</span>
          </h2>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PRINCIPLES.map((p) => (
              <div key={p.title} className="bg-[#222] p-7">
                <p.icon size={30} className="text-[#bb9c69]" />
                <h3 className="font-display mt-4 text-lg text-white">
                  {p.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-white/60">
                  {p.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Уровень сервиса и отзывы */}
      <section className="container-site py-20">
        <div className="mx-auto max-w-4xl border border-[#e8e2d5] bg-white p-10 text-center sm:p-14">
          <BadgeCheck size={36} className="mx-auto text-[#bb9c69]" />
          <h2 className="font-display mt-5 text-2xl font-bold text-[#1f1f1f] sm:text-3xl">
            Обладатели высшего уровня сервиса на{" "}
            <span className="text-[#bb9c69]">ЦИАН</span> и{" "}
            <span className="text-[#bb9c69]">Авито</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[#1f1f1f]/60">
            Крупнейшие площадки недвижимости присвоили агентству максимальные
            статусы качества обслуживания. А отзывы гостей можно прочитать на
            независимых площадках — Яндекс Картах и 2ГИС.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/reviews" className="btn-gold">
              <Star size={16} className="mr-2 inline" /> Отзывы о нас
            </Link>
            <a
              href={REVIEW_LINKS.yandexMaps}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline-gold"
            >
              Яндекс Карты
            </a>
            <a
              href={REVIEW_LINKS.gis2}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline-gold"
            >
              2ГИС
            </a>
          </div>
        </div>
      </section>

      {/* Сообщества */}
      <section className="section-dark py-20">
        <div className="container-site">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-[#bb9c69]">
              Мы на связи
            </p>
            <h2 className="font-display mt-3 text-3xl font-bold text-white sm:text-4xl">
              Наши <span className="text-[#bb9c69]">сообщества</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/60">
              Новые дома, свободные даты, акции и живые фото с праздников —
              подписывайтесь, чтобы ничего не пропустить.
            </p>
          </div>
          <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-2">
            <a
              href={SOCIAL.vk}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-6 bg-[#1f1f1f] p-8 transition-colors hover:bg-[#242424]"
            >
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#0077FF]/15 text-[#4d94ff] transition-transform group-hover:scale-110">
                <VkIcon size={30} />
              </span>
              <span>
                <span className="font-display block text-xl font-bold text-white">
                  Сообщество ВКонтакте
                </span>
                <span className="mt-1 block text-sm text-white/60">
                  vk.ru/rentadom — новости, новые коттеджи и отчёты с праздников
                </span>
              </span>
            </a>
            <a
              href={SOCIAL.telegramChannel}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-6 bg-[#1f1f1f] p-8 transition-colors hover:bg-[#242424]"
            >
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#229ED9]/15 text-[#54a9eb] transition-transform group-hover:scale-110">
                <Send size={28} />
              </span>
              <span>
                <span className="font-display block text-xl font-bold text-white">
                  Telegram-канал
                </span>
                <span className="mt-1 block text-sm text-white/60">
                  t.me/gorodamiraSpB — свободные даты, акции и подборки домов
                </span>
              </span>
            </a>
          </div>
        </div>
      </section>

      <section className="container-site py-20 text-center">
        <h2 className="font-display text-3xl font-bold text-[#1f1f1f]">
          Готовы выбрать дом для праздника?
        </h2>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link to="/catalog" className="btn-gold">
            Смотреть каталог
          </Link>
          <Link to="/contacts" className="btn-outline-gold">
            Связаться с нами
          </Link>
        </div>
      </section>
    </div>
  );
}
