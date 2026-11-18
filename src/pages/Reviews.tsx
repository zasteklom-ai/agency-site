import {
  BadgeCheck,
  MessageCircleHeart,
  ExternalLink,
  Award,
  Quote,
} from "lucide-react";
import { LeadForm } from "@/components/LeadForm";
import { GuestReviewsCarousel } from "@/components/GuestReviewsCarousel";
import { usePageMeta } from "@/hooks/usePageMeta";
import { SOCIAL } from "@/config";

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
    "Отзывы гостей об аренде коттеджей и банкетах от агентства «Города Мира». Суперагент ЦИАН, высший уровень сервиса Авито.",
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

      {/* Отзывы гостей */}
      <section className="bg-[#f3f7f6] py-20">
        <div className="container-site">
          <div className="text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#1f7567]/10">
              <Quote size={26} className="text-[#1f7567]" />
            </div>
            <p className="mt-5 text-xs uppercase tracking-[0.3em] text-[#1f7567]">
              Отзывы гостей
            </p>
            <h2 className="font-display mt-3 text-3xl font-bold text-[#1f1f1f] sm:text-4xl">
              Что говорят <span className="text-[#1f7567]">наши гости</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[#1f1f1f]/60">
              Все отзывы — реальные: гости оставляют их на независимых
              площадках после праздников, а мы собрали их здесь, чтобы вам было
              проще сделать выбор.
            </p>
          </div>

          <div className="mt-12">
            <GuestReviewsCarousel />
          </div>

          <div className="mx-auto mt-14 max-w-3xl bg-[#1f7567] p-8 text-center sm:p-10">
            <MessageCircleHeart
              size={30}
              className="mx-auto text-white"
            />
            <p className="mt-4 text-sm leading-relaxed text-white/90">
              Побывали у нас на празднике? Расскажите о впечатлениях в нашей
              группе ВКонтакте — ваш отзыв поможет другим гостям сделать выбор,
              а нам — поддерживать высший уровень сервиса.
            </p>
            <a
              href={SOCIAL.vk}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white underline-offset-4 transition-colors hover:underline"
            >
              Оставить отзыв в ВКонтакте <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </section>

      {/* Лид-форма */}
      <section className="bg-[#1a1a1a] py-20">
        <div className="container-site">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#45c1af]">
                Обратная связь
              </p>
              <h2 className="font-display mt-3 text-3xl font-bold text-white sm:text-4xl">
                Станьте нашим следующим{" "}
                <span className="text-[#45c1af]">довольным гостем</span>
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-white/60">
                Оставьте заявку — подберём коттедж под ваш праздник и
                организуем всё под ключ, как уже сделали для сотен семей и
                компаний.
              </p>
            </div>
            <div className="border border-white/10 bg-[#1f1f1f] p-8 text-white sm:p-10">
              <LeadForm dark />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
