import { LeadForm } from "@/components/LeadForm";
import { PhoneContact } from "@/components/PhoneContact";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Phone, Mail, MapPin, Clock } from "lucide-react";

export default function Contacts() {
  usePageMeta(
    "Контакты — Города Мира | Аренда коттеджей в СПб и Ленобласти",
    "Телефон, мессенджеры и форма заявки агентства «Города Мира». Подберём коттедж для праздника за 15 минут, на связи 24/7.",
  );
  return (
    <div className="min-h-screen pt-20">
      <div className="bg-[#141414] py-20">
        <div className="container-site text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-[#bb9c69]">
            Контакты
          </p>
          <h1 className="font-display mt-3 text-3xl font-bold text-white sm:text-5xl">
            Свяжитесь с нами
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm text-white/60">
            Ответим на вопросы, подберём коттедж и организуем просмотр в
            удобное время
          </p>
        </div>
      </div>

      <div className="container-site grid gap-12 py-16 lg:grid-cols-2">
        <div>
          <div className="space-y-6">
            {[
              {
                icon: Phone,
                title: "Телефон",
                content: (
                  <PhoneContact
                    variant="footer"
                    className="text-lg font-semibold text-[#bb9c69] [&_span]:!text-lg [&_button]:!text-[#bb9c69] hover:[&_button]:!text-[#a9874d]"
                  />
                ),
              },
              {
                icon: Mail,
                title: "Email",
                content: (
                  <a
                    href="mailto:info@goroda-mira.ru"
                    className="text-lg font-semibold text-[#bb9c69] hover:text-[#a9874d]"
                  >
                    info@goroda-mira.ru
                  </a>
                ),
              },
              {
                icon: MapPin,
                title: "География",
                content: (
                  <p className="text-[#1f1f1f]/70">
                    Санкт-Петербург и вся Ленинградская область: Всеволожский,
                    Ломоносовский, Приозерский, Выборгский и другие районы
                  </p>
                ),
              },
              {
                icon: Clock,
                title: "Режим работы",
                content: (
                  <p className="text-[#1f1f1f]/70">
                    Ежедневно с 9:00 до 22:00. Заявки с сайта принимаем
                    круглосуточно.
                  </p>
                ),
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-[#bb9c69]/10">
                  <item.icon size={20} className="text-[#bb9c69]" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#1f1f1f]/50">
                    {item.title}
                  </h3>
                  <div className="mt-1.5">{item.content}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-[#e8e2d5] bg-white p-8 sm:p-10">
          <h2 className="font-display text-2xl font-bold text-[#1f1f1f]">
            Оставить заявку
          </h2>
          <p className="mt-2 text-sm text-[#1f1f1f]/60">
            Перезвоним в течение 15 минут в рабочее время
          </p>
          <div className="mt-6">
            <LeadForm />
          </div>
        </div>
      </div>
    </div>
  );
}
