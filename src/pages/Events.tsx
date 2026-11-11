import { useState } from "react";
import { Link } from "react-router";
import { LeadForm } from "@/components/LeadForm";
import { usePageMeta } from "@/hooks/usePageMeta";
import {
  Heart,
  Cake,
  Briefcase,
  PartyPopper,
  Flower2,
  Music,
  UtensilsCrossed,
  Salad,
  Flame,
  Check,
} from "lucide-react";

const EVENT_TYPES = [
  {
    icon: Heart,
    title: "Свадьбы",
    description:
      "Красивые усадьбы с банкетными залами, верандами и ухоженными территориями. Церемония на природе, фотосессия у воды и праздник до утра — всё в одном месте.",
    features: ["Банкетные залы до 100 гостей", "Площадки для выездной церемонии", "Ночёвка для гостей"],
  },
  {
    icon: Cake,
    title: "Дни рождения и юбилеи",
    description:
      "Уютные дома с баней, бассейном и мангальной зоной. Отметьте праздник в кругу близких без соседей за стеной и ограничений по времени.",
    features: ["Дома от 6 до 30 гостей", "Бани, бассейны, купели", "Возможность с животными"],
  },
  {
    icon: Briefcase,
    title: "Корпоративы",
    description:
      "Вместительные коттеджи для командных мероприятий: от стратегических сессий до шумных праздников с караоке и бильярдом.",
    features: ["Вместимость до 50 человек", "Залы для презентаций", "Трансфер и кейтеринг"],
  },
  {
    icon: PartyPopper,
    title: "Вечеринки и банкеты",
    description:
      "Уединённые локации вдали от города, где можно веселиться в своё удовольствие, не мешая соседям.",
    features: ["Изолированные участки", "Мощная акустика", "Парковка для всех гостей"],
  },
  {
    icon: Flower2,
    title: "Выпускные и семейные торжества",
    description:
      "Торжественные залы с декором, открытые террасы и зоны для фуршета на свежем воздухе.",
    features: ["Оформление залов", "Фотозоны", "Детские площадки"],
  },
  {
    icon: Music,
    title: "Квесты и тимбилдинг",
    description:
      "Большие участки с лесом и водой — идеальное пространство для активных сценариев и командных игр.",
    features: ["Участки до 50 соток", "Лесные локации", "Организация сценария"],
  },
];

type MenuSection = { title: string; items: string[]; images?: string[] };
type MenuVariant = {
  id: number;
  name: string;
  price: number;
  sections: MenuSection[];
};

const MENU_VARIANTS: MenuVariant[] = [
  {
    id: 1,
    name: "Вариант №1",
    price: 4800,
    sections: [
      {
        title: "Холодные закуски",
        images: ["/banquet/meat-plate.jpg", "/banquet/fish.jpg", "/banquet/cheese.jpg"],
        items: [
          "Мясные деликатесы (карбонад, ласунак, рулет из птицы, зелень, хрен)",
          "Рыбное ассорти (форель с/с, горбуша х/к, зубатка х/к, укроп, маслины)",
          "Сырное плато (пармезан, моцарелла, дор блю, орехи, виноград, мёд)",
          "Овощное ассорти",
          "Филе сельди с отварным картофелем и маринованным лучком",
          "Ветчинные рулеты с чесноком и сыром",
        ],
      },
      {
        title: "Салаты",
        items: [
          "Цезарь с курой (айсберг, куриное филе, яйцо, гренки, пармезан, томаты черри, соус цезарь, зелень)",
          "Деревенский с говядиной (картофель, морковь, огурец солёный, яйцо, говядина отварная, горошек, майонез, зелень)",
          "Мимоза с горбушей (горбуша, картофель, морковь, яйцо, кукуруза, майонез, зелень)",
          "Салат с копчёной курой и грибами (помидор, майонез, яйцо, сыр гауда, копчёная кура, грибы)",
        ],
      },
      {
        title: "Горячее",
        images: ["/banquet/shashlik.jpg"],
        items: [
          "Филе бедра цыплёнка, маринованного в ананасовом пюре",
          "Шашлык из свиной шейки с копчёной паприкой",
          "Овощи гриль сезонные (баклажан, кабачок, помидор, перец)",
          "Картофель боло, томатный соус, лаваш",
        ],
      },
    ],
  },
  {
    id: 2,
    name: "Вариант №2",
    price: 4800,
    sections: [
      {
        title: "Холодные закуски",
        images: ["/banquet/meat-plate.jpg", "/banquet/fish.jpg", "/banquet/cheese.jpg"],
        items: [
          "Мясные деликатесы (карбонад, ласунак, рулет из птицы, зелень, хрен)",
          "Рыбное ассорти (форель с/с, горбуша х/к, зубатка х/к, укроп, маслины)",
          "Сырное плато (пармезан, моцарелла, дор блю, орехи, виноград, мёд)",
          "Капрезе (моцарелла, помидор, песто, бальзамический соус)",
          "Ветчинные рулеты с чесноком и сыром",
          "Рулеты из цукини с творожным сыром и рукколой",
        ],
      },
      {
        title: "Салаты",
        items: [
          "Цезарь с курой (айсберг, куриное филе, яйцо, гренки, пармезан, томаты черри, соус цезарь, зелень)",
          "Салат с языком (варёный говяжий язык, перец сладкий, лук ялтинский, чеснок, красная фасоль, помидоры, оливковое масло)",
          "Мимоза с горбушей (горбуша, картофель, морковь, яйцо, кукуруза, майонез, зелень)",
          "Салат с копчёной курой и грибами (помидор, майонез, яйцо, сыр гауда, копчёная кура, грибы)",
        ],
      },
      {
        title: "Горячее",
        images: ["/banquet/shashlik.jpg"],
        items: [
          "Филе бедра цыплёнка, маринованного в ананасовом пюре",
          "Шашлык из свиной шейки с копчёной паприкой",
          "Овощи гриль сезонные (баклажан, кабачок, помидор, перец)",
          "Картофель боло, томатный соус, лаваш",
        ],
      },
    ],
  },
  {
    id: 3,
    name: "Вариант №3",
    price: 4800,
    sections: [
      {
        title: "Холодные закуски",
        images: ["/banquet/meat-plate.jpg", "/banquet/fish.jpg", "/banquet/cheese.jpg"],
        items: [
          "Мясные деликатесы (карбонад, ласунак, рулет из птицы, зелень, хрен)",
          "Рыбное ассорти (форель с/с, горбуша х/к, зубатка х/к, укроп, маслины)",
          "Сырное плато (пармезан, моцарелла, дор блю, орехи, виноград, мёд)",
          "Соленья (огурцы, помидоры, морковь по-корейски)",
          "Рулет из птицы с творожным сыром",
          "Буженина домашняя с хреном",
        ],
      },
      {
        title: "Салаты",
        items: [
          "Цезарь с курой (айсберг, куриное филе, яйцо, гренки, пармезан, томаты черри, соус цезарь, зелень)",
          "Салат греческий с фетой",
          "Мимоза с горбушей (горбуша, картофель, морковь, яйцо, кукуруза, майонез, зелень)",
          "Деревенский с говядиной (картофель, морковь, огурец солёный, яйцо, говядина отварная, горошек, майонез, зелень)",
        ],
      },
      {
        title: "Горячее",
        images: ["/banquet/shashlik.jpg"],
        items: [
          "Филе бедра цыплёнка, маринованного в ананасовом пюре",
          "Шашлык из свиной шейки с копчёной паприкой",
          "Овощи гриль сезонные (баклажан, кабачок, помидор, перец)",
          "Картофель боло, томатный соус, лаваш",
        ],
      },
    ],
  },
  {
    id: 4,
    name: "Вариант №4",
    price: 5200,
    sections: [
      {
        title: "Холодные закуски",
        images: ["/banquet/meat-plate.jpg", "/banquet/fish.jpg", "/banquet/cheese.jpg"],
        items: [
          "Мясные деликатесы (карбонад, ласунак, рулет из птицы, зелень, хрен)",
          "Рыбное ассорти (форель с/с, горбуша х/к, зубатка х/к, укроп, маслины)",
          "Сырное плато (пармезан, моцарелла, дор блю, орехи, виноград, мёд)",
          "Брускетта с творожным сыром, копчёной курой и вялеными томатами",
          "Ролл с творожным сыром и лососем",
          "Оливки, киви зелёные",
        ],
      },
      {
        title: "Салаты",
        items: [
          "Капрезе (томаты, моцарелла буффало, зелень, соус песто, бальзамический крем, кедровый орех)",
          "Салат с языком (варёный говяжий язык, перец сладкий, лук ялтинский, чеснок, красная фасоль, помидоры, оливковое масло)",
          "Цезарь с курой и беконом (айсберг, куриное филе, бекон, яйцо, гренки, пармезан, томаты черри, соус цезарь, зелень)",
          "Салат нисуаз (картофель беби, яйцо отварное, черри, корнишоны, микс-салат, тунец, медово-горчичный соус)",
          "Салат с копчёной курой и грибами (помидор, майонез, яйцо, сыр гауда, копчёная кура, грибы)",
        ],
      },
      {
        title: "Горячее",
        images: ["/banquet/shashlik.jpg", "/banquet/salmon-steak.jpg"],
        items: [
          "Филе бедра цыплёнка, маринованного в ананасовом пюре",
          "Шашлык из свиной шейки с копчёной паприкой",
          "Стейк радужной форели",
          "Овощи гриль сезонные (баклажан, кабачок, помидор, перец)",
          "Картофель боло, томатный соус, лаваш",
        ],
      },
    ],
  },
];

const SECTION_ICONS = [UtensilsCrossed, Salad, Flame];

export default function Events() {
  const [activeMenu, setActiveMenu] = useState(0);
  const menu = MENU_VARIANTS[activeMenu];
  usePageMeta(
    "Мероприятия и банкетная служба за городом — Города Мира",
    "Свадьбы, юбилеи, корпоративы в загородных коттеджах. Банкетное меню от 4 800 ₽/персона: холодные закуски, салаты, горячее, обслуживание под ключ.",
  );

  return (
    <div className="min-h-screen pt-20">
      <div className="bg-[#141414] py-20">
        <div className="container-site text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-[#bb9c69]">
            Загородные праздники
          </p>
          <h1 className="font-display mx-auto mt-3 max-w-3xl text-3xl font-bold text-white sm:text-5xl">
            Мероприятия и{" "}
            <span className="text-[#bb9c69]">банкетная служба</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-white/60">
            Подберём коттедж под формат вашего события и организуем банкет:
            готовое меню, сервировка и обслуживание — всё под ключ.
          </p>
        </div>
      </div>

      {/* Форматы мероприятий */}
      <div className="container-site py-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {EVENT_TYPES.map((e) => (
            <div
              key={e.title}
              className="group border border-[#e8e2d5] bg-white p-8 transition-all hover:border-[#bb9c69] hover:shadow-lg"
            >
              <e.icon
                size={36}
                className="text-[#bb9c69] transition-transform group-hover:scale-110"
              />
              <h2 className="font-display mt-5 text-xl font-bold text-[#1f1f1f]">
                {e.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#1f1f1f]/60">
                {e.description}
              </p>
              <ul className="mt-4 space-y-1.5">
                {e.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2 text-xs text-[#1f1f1f]/70"
                  >
                    <span className="h-1 w-1 rounded-full bg-[#bb9c69]" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Банкетная служба */}
      <section className="section-dark py-20">
        <div className="container-site">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#bb9c69]">
                Банкетная служба
              </p>
              <h2 className="font-display mt-3 text-3xl font-bold text-white sm:text-4xl">
                Праздничный стол,{" "}
                <span className="text-[#bb9c69]">о котором не нужно думать</span>
              </h2>
              <p className="mt-5 max-w-lg text-sm leading-relaxed text-white/60">
                Наша банкетная служба полностью берёт на себя застолье: привезём,
                сервируем, приготовим и обслужим. Четыре готовых варианта меню —
                от классических застолий до торжественных банкетов со стейком из
                форели.
              </p>
              <ul className="mt-6 space-y-2.5">
                {[
                  "Выездное обслуживание в любом коттедже каталога",
                  "Сервировка, посуда и персонал включены",
                  "Меню адаптируем под пожелания и бюджет",
                ].map((t) => (
                  <li key={t} className="flex items-center gap-3 text-sm text-white/70">
                    <Check size={16} className="shrink-0 text-[#bb9c69]" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <img
                src="/banquet/banquet-hall.jpg"
                alt="Сервированный банкетный стол"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 border border-[#bb9c69]/30" />
            </div>
          </div>
        </div>
      </section>

      {/* Меню */}
      <section className="bg-[#f9f7f2] py-20">
        <div className="container-site">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-[#bb9c69]">
              Банкетное меню
            </p>
            <h2 className="font-display mt-3 text-3xl font-bold text-[#1f1f1f] sm:text-4xl">
              Готовые варианты застолья
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[#1f1f1f]/60">
              Стоимость указана за персону. К стоимости меню добавляется 10% за
              обслуживание.
            </p>
          </div>

          {/* Переключатель вариантов */}
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {MENU_VARIANTS.map((v, i) => (
              <button
                key={v.id}
                onClick={() => setActiveMenu(i)}
                className={`border px-6 py-3 text-sm uppercase tracking-wider transition-colors ${
                  i === activeMenu
                    ? "border-[#bb9c69] bg-[#bb9c69] text-white"
                    : "border-[#1f1f1f]/20 bg-white text-[#1f1f1f]/70 hover:border-[#bb9c69] hover:text-[#bb9c69]"
                }`}
              >
                {v.name} · {v.price.toLocaleString("ru-RU")} ₽
              </button>
            ))}
          </div>

          {/* Состав меню */}
          <div className="mx-auto mt-12 max-w-5xl">
            <div className="mb-8 flex items-center justify-center gap-4">
              <span className="h-px w-16 bg-[#bb9c69]" />
              <p className="font-display text-xl font-bold text-[#1f1f1f]">
                {menu.name} — {menu.price.toLocaleString("ru-RU")} ₽/персона
              </p>
              <span className="h-px w-16 bg-[#bb9c69]" />
            </div>

            <div className="space-y-12">
              {menu.sections.map((section, si) => {
                const Icon = SECTION_ICONS[si] ?? UtensilsCrossed;
                return (
                  <div key={section.title}>
                    <div className="flex items-center gap-4">
                      <Icon size={26} className="text-[#bb9c69]" />
                      <h3 className="font-display text-2xl font-bold uppercase tracking-wide text-[#1f1f1f]">
                        {section.title}
                      </h3>
                      <span className="h-px flex-1 bg-[#e8e2d5]" />
                    </div>

                    {section.images && (
                      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
                        {section.images.map((img) => (
                          <div key={img} className="overflow-hidden">
                            <img
                              src={img}
                              alt={section.title}
                              loading="lazy"
                              className="h-44 w-full object-cover transition-transform duration-500 hover:scale-105 sm:h-52"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    <ul className="mt-6 grid gap-x-10 gap-y-3 md:grid-cols-2">
                      {section.items.map((item) => (
                        <li
                          key={item}
                          className="flex gap-3 text-sm leading-relaxed text-[#1f1f1f]/75"
                        >
                          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#bb9c69]" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            <p className="mt-12 text-center text-xs uppercase tracking-[0.25em] text-[#1f1f1f]/50">
              + 10% за обслуживание · меню можно скорректировать под ваши пожелания
            </p>
          </div>
        </div>
      </section>

      {/* Лид-форма */}
      <section className="section-dark py-20">
        <div className="container-site grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
              Обсудим ваше{" "}
              <span className="text-[#bb9c69]">мероприятие?</span>
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/60">
              Расскажите о дате, количестве гостей и формате — предложим
              подходящие площадки, рассчитаем банкет и стоимость под ключ.
            </p>
          </div>
          <div className="bg-[#1f1f1f] p-8 text-white sm:p-10">
            <LeadForm dark />
          </div>
        </div>
      </section>

      <div className="container-site py-14 text-center">
        <Link to="/catalog" className="btn-gold">
          Смотреть коттеджи
        </Link>
      </div>
    </div>
  );
}
