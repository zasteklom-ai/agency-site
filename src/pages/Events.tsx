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
        images: [
          "/banquet/meat-plate.jpg",
          "/banquet/fish.jpg",
          "/banquet/cheese.jpg",
          "/banquet/bruschetta.jpg",
        ],
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
        images: ["/banquet/caesar.jpg"],
        items: [
          "Цезарь с курой (айсберг, куриное филе, яйцо, гренки, пармезан, томаты черри, соус цезарь, зелень)",
          "Деревенский с говядиной (картофель, морковь, огурец солёный, яйцо, говядина отварная, горошек, майонез, зелень)",
          "Мимоза с горбушей (горбуша, картофель, морковь, яйцо, кукуруза, майонез, зелень)",
          "Салат с копчёной курой и грибами (помидор, майонез, яйцо, сыр гауда, копчёная кура, грибы)",
        ],
      },
      {
        title: "Горячее",
        images: ["/banquet/shashlik.jpg", "/banquet/grill-veg.jpg", "/banquet/salmon-steak.jpg"],
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
        images: [
          "/banquet/meat-plate.jpg",
          "/banquet/fish.jpg",
          "/banquet/cheese.jpg",
          "/banquet/bruschetta.jpg",
        ],
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
        images: ["/banquet/caesar.jpg"],
        items: [
          "Цезарь с курой (айсберг, куриное филе, яйцо, гренки, пармезан, томаты черри, соус цезарь, зелень)",
          "Салат с языком (варёный говяжий язык, перец сладкий, лук ялтинский, чеснок, красная фасоль, помидоры, оливковое масло)",
          "Мимоза с горбушей (горбуша, картофель, морковь, яйцо, кукуруза, майонез, зелень)",
          "Салат с копчёной курой и грибами (помидор, майонез, яйцо, сыр гауда, копчёная кура, грибы)",
        ],
      },
      {
        title: "Горячее",
        images: ["/banquet/shashlik.jpg", "/banquet/grill-veg.jpg", "/banquet/salmon-steak.jpg"],
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
        images: [
          "/banquet/meat-plate.jpg",
          "/banquet/fish.jpg",
          "/banquet/cheese.jpg",
          "/banquet/bruschetta.jpg",
        ],
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
        images: ["/banquet/caesar.jpg"],
        items: [
          "Цезарь с курой (айсберг, куриное филе, яйцо, гренки, пармезан, томаты черри, соус цезарь, зелень)",
          "Салат греческий с фетой",
          "Мимоза с горбушей (горбуша, картофель, морковь, яйцо, кукуруза, майонез, зелень)",
          "Деревенский с говядиной (картофель, морковь, огурец солёный, яйцо, говядина отварная, горошек, майонез, зелень)",
        ],
      },
      {
        title: "Горячее",
        images: ["/banquet/shashlik.jpg", "/banquet/grill-veg.jpg", "/banquet/salmon-steak.jpg"],
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
        images: [
          "/banquet/meat-plate.jpg",
          "/banquet/fish.jpg",
          "/banquet/cheese.jpg",
          "/banquet/bruschetta.jpg",
        ],
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
        images: ["/banquet/caesar.jpg"],
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
        images: ["/banquet/shashlik.jpg", "/banquet/grill-veg.jpg", "/banquet/salmon-steak.jpg"],
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

const DISH_ALTS: Record<string, string> = {
  "/banquet/meat-plate.jpg": "Мясное ассорти",
  "/banquet/fish.jpg": "Рыбное ассорти",
  "/banquet/cheese.jpg": "Сырное плато",
  "/banquet/bruschetta.jpg": "Брускетты с лососем, икрой и томатами",
  "/banquet/caesar.jpg": "Салат цезарь с курицей",
  "/banquet/shashlik.jpg": "Шашлык из свиной шейки",
  "/banquet/grill-veg.jpg": "Овощи гриль сезонные",
  "/banquet/salmon-steak.jpg": "Стейк радужной форели с овощами",
};

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
          <p className="text-xs uppercase tracking-[0.3em] text-[#45c1af]">
            Загородные праздники
          </p>
          <h1 className="font-display mx-auto mt-3 max-w-3xl text-3xl font-bold text-white sm:text-5xl">
            Мероприятия и{" "}
            <span className="text-[#45c1af]">банкетная служба</span>
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
              className="group border border-[#e3e7e4] bg-white p-8 transition-all hover:border-[#1f7567] hover:shadow-lg"
            >
              <e.icon
                size={36}
                className="text-[#1f7567] transition-transform group-hover:scale-110"
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
                    <span className="h-1 w-1 rounded-full bg-[#1f7567]" />
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
              <p className="text-xs uppercase tracking-[0.3em] text-[#45c1af]">
                Банкетная служба
              </p>
              <h2 className="font-display mt-3 text-3xl font-bold text-white sm:text-4xl">
                Праздничный стол,{" "}
                <span className="text-[#45c1af]">о котором не нужно думать</span>
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
                    <Check size={16} className="shrink-0 text-[#45c1af]" />
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
              <div className="absolute inset-0 border border-[#45c1af]/30" />
            </div>
          </div>
        </div>
      </section>

      {/* Меню */}
      <section className="bg-[#f2f6f4] py-20">
        <div className="container-site">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-[#1f7567]">
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
                    ? "border-[#1f7567] bg-[#1f7567] text-white"
                    : "border-[#1f1f1f]/20 bg-white text-[#1f1f1f]/70 hover:border-[#1f7567] hover:text-[#1f7567]"
                }`}
              >
                {v.name} · {v.price.toLocaleString("ru-RU")} ₽
              </button>
            ))}
          </div>

          {/* Состав меню */}
          <div className="mx-auto mt-12 max-w-5xl">
            <div className="mb-8 flex items-center justify-center gap-4">
              <span className="h-px w-16 bg-[#1f7567]" />
              <p className="font-display text-xl font-bold text-[#1f1f1f]">
                {menu.name} — {menu.price.toLocaleString("ru-RU")} ₽/персона
              </p>
              <span className="h-px w-16 bg-[#1f7567]" />
            </div>

            <div className="space-y-6">
              {menu.sections.map((section, si) => {
                const images = section.images ?? [];
                const wide = images.length === 1;
                return (
                  <div
                    key={section.title}
                    className="border border-[#e3e7e4] bg-white p-5 shadow-sm sm:p-8"
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-display flex h-10 w-10 shrink-0 items-center justify-center border border-[#1f7567]/50 text-sm text-[#1f7567]">
                        0{si + 1}
                      </span>
                      <h3 className="font-display text-xl font-bold uppercase tracking-wide text-[#1f1f1f] sm:text-2xl">
                        {section.title}
                      </h3>
                      <span className="h-px flex-1 bg-[#e3e7e4]" />
                    </div>

                    {images.length > 0 && (
                      <div
                        className={`mt-6 grid gap-3 sm:gap-4 ${
                          wide
                            ? "grid-cols-1"
                            : images.length === 3
                              ? "grid-cols-3"
                              : "grid-cols-2 lg:grid-cols-4"
                        }`}
                      >
                        {images.map((img) => (
                          <div
                            key={img}
                            className={`group overflow-hidden ${
                              wide
                                ? "aspect-[16/9] sm:aspect-[21/9]"
                                : "aspect-[4/3]"
                            }`}
                          >
                            <img
                              src={img}
                              alt={DISH_ALTS[img] ?? section.title}
                              loading="lazy"
                              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
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
                          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#1f7567]" />
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
              <span className="text-[#45c1af]">мероприятие?</span>
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
        <Link to="/catalog" className="btn-brand">
          Смотреть коттеджи
        </Link>
      </div>
    </div>
  );
}
