import { Link } from "react-router";
import { Mail, MapPin, Send } from "lucide-react";
import { PhoneContact } from "./PhoneContact";
import { CONTACTS, SOCIAL } from "@/config";

function VkIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M13.16 17.5c-5.61 0-8.84-3.86-8.97-10.32h2.82c.1 4.73 2.18 6.73 3.83 7.14V7.18h2.65v4.08c1.63-.18 3.35-2.04 3.93-4.08h2.65c-.43 2.44-2.24 4.24-3.52 4.99 1.28.6 3.34 2.17 4.12 5.33h-2.92c-.62-1.94-2.17-3.44-4.3-3.72v3.72h-.29Z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="section-dark">
      <div className="container-site grid gap-10 py-16 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden">
              <img
                src="/logo.png"
                alt="Логотип Города Мира"
                className="h-full w-full object-contain"
              />
            </span>
            <div className="font-display text-2xl font-bold text-white">
              Города <span className="text-[#45c1af]">Мира</span>
            </div>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
            Посуточная аренда коттеджей в Санкт-Петербурге и Ленинградской
            области для праздников, свадеб и мероприятий.
          </p>
        </div>
        <div>
          <h4 className="font-display text-lg text-[#45c1af]">Навигация</h4>
          <nav className="mt-4 flex flex-col gap-2 text-sm text-white/70">
            <Link to="/catalog" className="hover:text-[#45c1af]">
              Каталог коттеджей
            </Link>
            <Link to="/events" className="hover:text-[#45c1af]">
              Мероприятия и банкеты
            </Link>
            <Link to="/reviews" className="hover:text-[#45c1af]">
              Отзывы
            </Link>
            <Link to="/about" className="hover:text-[#45c1af]">
              О нас
            </Link>
            <Link to="/contacts" className="hover:text-[#45c1af]">
              Контакты
            </Link>
          </nav>
        </div>
        <div>
          <h4 className="font-display text-lg text-[#45c1af]">Контакты</h4>
          <div className="mt-4 flex flex-col gap-3 text-sm text-white/70">
            <PhoneContact variant="footer" />
            <a
              href={`mailto:${CONTACTS.email}`}
              className="flex items-center gap-2 hover:text-[#45c1af]"
            >
              <Mail size={15} /> {CONTACTS.email}
            </a>
            <span className="flex items-center gap-2">
              <MapPin size={15} /> Санкт-Петербург и Ленинградская область
            </span>
            <div className="mt-2 flex items-center gap-4 border-t border-white/10 pt-4">
              <a
                href={SOCIAL.vk}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-[#45c1af]"
              >
                <VkIcon /> Сообщество ВКонтакте
              </a>
              <a
                href={SOCIAL.telegramChannel}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-[#45c1af]"
              >
                <Send size={15} /> Telegram-канал
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-6 text-center text-xs text-white/40">
        © {new Date().getFullYear()} Города Мира. Посуточная аренда коттеджей.{" "}
        <Link
          to="/admin"
          className="text-white/25 transition-colors hover:text-[#45c1af]"
        >
          Вход для администратора
        </Link>
      </div>
    </footer>
  );
}
