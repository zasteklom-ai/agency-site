import { useState } from "react";
import { Link, useLocation } from "react-router";
import { Menu, X } from "lucide-react";
import { PhoneContact } from "./PhoneContact";

const NAV = [
  { to: "/", label: "Главная" },
  { to: "/catalog", label: "Каталог коттеджей" },
  { to: "/events", label: "Мероприятия и банкеты" },
  { to: "/reviews", label: "Отзывы" },
  { to: "/about", label: "О нас" },
  { to: "/contacts", label: "Контакты" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#141414]/95 backdrop-blur-md">
      <div className="container-site flex h-20 items-center justify-between">
        <Link to="/" className="flex flex-col leading-none">
          <span className="font-display text-2xl font-bold tracking-wide text-white">
            Города <span className="text-[#bb9c69]">Мира</span>
          </span>
          <span className="mt-1 text-[10px] uppercase tracking-[0.3em] text-white/50">
            аренда коттеджей
          </span>
        </Link>

        <nav className="hidden items-center gap-6 xl:gap-7 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`text-[11px] uppercase tracking-wider transition-colors xl:text-[13px] ${
                location.pathname === item.to
                  ? "text-[#bb9c69]"
                  : "text-white/80 hover:text-[#bb9c69]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <PhoneContact variant="header" />
          <Link to="/contacts" className="btn-gold !px-5 !py-3 text-xs whitespace-nowrap">
            Подобрать дом
          </Link>
        </div>

        <button
          className="flex h-11 w-11 items-center justify-center text-white lg:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Меню"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-[#141414] lg:hidden">
          <nav className="container-site flex flex-col py-4">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={`py-3 text-sm uppercase tracking-wider ${
                  location.pathname === item.to
                    ? "text-[#bb9c69]"
                    : "text-white/80"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 py-3">
              <PhoneContact variant="mobile" />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
