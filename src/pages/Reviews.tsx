import { Star, MapPin, BadgeCheck, MessageCircleHeart, ExternalLink, Award } from "lucide-react";
import { LeadForm } from "@/components/LeadForm";
import { usePageMeta } from "@/hooks/usePageMeta";
import { REVIEW_LINKS } from "@/config";

const MAP_CARDS = [
  {
    name: "Яндекс Карты",
    url: REVIEW_LINKS.yandexMaps,
    description:
      "Агентство недвижимости «Города Мира» на Яндекс Картах — живые отзывы гостей, фотографии домов и наш рейтинг.",
    action: "Читать отзывы на Яндекс Картах",
  },
  {
    name: "2ГИС",
    url: REVIEW_LINKS.gis2,
    description:
      "Наша карточка в справочнике 2ГИС: отзывы клиентов, контакты и точное расположение офиса.",
    action: "Читать отзывы в 2ГИС",
  },
];

const SERVICE_AWARDS = [
  {
    platform: "ЦИАН",
    level: "Суперагент",
    text: "Высший уровень качества сервиса по версии программы лояльности ЦИАН: отличное общение с клиентами, высокая частота ответов и отсутствие серьёзных нарушений.",
  },
  {
    platform: "Авито",
    level: "Высший уровень сервиса",
    text: "Максимальный рейтинг качества обслуживания на Авито — площадка отмечает скорость наших ответов, вежливость и надёжность сделок.",
  },
];

export default function Reviews() {
  usePageMeta(
    "Отзывы об агентстве Города Мира — высший уровень сервиса на ЦИАН и Авито",
    "Отзывы гостей на Яндекс Картах и 2ГИС. Агентство «Города Мира» — обладатель статуса «Суперагент» ЦИАН и высшего уровня сервиса Авито.",
  );
  return (
    <div className="min-h-screen pt-20">
      {/* Заголовок */}
      <div className="bg-[#141414] py-20">
        <div className="container-site text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-[#45c1af]">
            Репутация
          </p>
          <h1 className="font-display mx-auto mt-3 max-w-3xl text-3xl font-bold text-white sm:text-5xl">
            Отзывы наших <span className="text-[#45c1af]">гостей</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-white/60">
            Мы дорожим каждым отзывом — они помогают нам становиться лучше, а
            вам — убедиться, что праздник в надёжных руках.
          </p>
        </div>
      </div>

      {/* Уровни сервиса */}
      <section className="container-site py-16">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-center gap-3 text-center">
            <Award size={28} className="text-[#1f7567]" />
            <h2 className="font-display text-2xl font-bold text-[#1f1f1f] sm:text-3xl">
              Обладатели высшего уровня сервиса
            </h2>
          </div>
          <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-[#1f1f1f]/60">
            Крупнейшие площадки недвижимости оценили качество нашей работы и
            присвоили агентству «Города Мира» максимальные статусы.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {SERVICE_AWARDS.map((a) => (
              <div
                key={a.platform}
                className="border border-[#e3e7e4] bg-white p-8 text-center"
              >
                <BadgeCheck size={40} className="mx-auto text-[#1f7567]" />
                <p className="mt-4 text-xs uppercase tracking-[0.25em] text-[#1f1f1f]/50">
                  {a.platform}
                </p>
                <h3 className="font-display mt-2 text-2xl font-bold text-[#1f1f1f]">
                  {a.level}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[#1f1f1f]/60">
                  {a.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Отзывы на картах */}
      <section className="section-dark py-20">
        <div className="container-site">
          <div className="text-center">
            <Star size={28} className="mx-auto text-[#45c1af]" />
            <h2 className="font-display mt-4 text-3xl font-bold text-white sm:text-4xl">
              Читайте отзывы <span className="text-[#45c1af]">на картах</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/60">
              Все отзывы размещены на независимых площадках — мы не редактируем
              и не удаляем их. Посмотрите, что говорят гости, и оставьте свой
              отзыв после праздника.
            </p>
          </div>
          <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-2">
            {MAP_CARDS.map((m) => (
              <a
                key={m.name}
                href={m.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col bg-[#1f1f1f] p-8 transition-colors hover:bg-[#242424]"
              >
                <MapPin size={32} className="text-[#45c1af]" />
                <h3 className="font-display mt-5 text-2xl font-bold text-white">
                  {m.name}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-white/60">
                  {m.description}
                </p>
                <span className="mt-6 inline-flex items-center gap-2 text-xs uppercase tracking-wider text-[#45c1af] transition-colors group-hover:text-white">
                  {m.action} <ExternalLink size={14} />
                </span>
              </a>
            ))}
          </div>

          <div className="mx-auto mt-12 max-w-3xl border border-white/10 bg-[#1a1a1a] p-8 text-center">
            <MessageCircleHeart size={30} className="mx-auto text-[#45c1af]" />
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              Побывали у нас на празднике? Расскажите о впечатлениях на Яндекс
              Картах или в 2ГИС — ваш отзыв поможет другим гостям сделать выбор,
              а нам — поддерживать высший уровень сервиса.
            </p>
          </div>
        </div>
      </section>

      {/* Лид-форма */}
      <section className="container-site py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-bold text-[#1f1f1f] sm:text-4xl">
              Станьте нашим следующим{" "}
              <span className="text-[#1f7567]">довольным гостем</span>
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-[#1f1f1f]/60">
              Оставьте заявку — подберём коттедж под ваш праздник и организуем
              всё под ключ, как уже сделали для сотен семей и компаний.
            </p>
          </div>
          <div className="bg-[#1f1f1f] p-8 text-white sm:p-10">
            <LeadForm dark />
          </div>
        </div>
      </section>
    </div>
  );
}
