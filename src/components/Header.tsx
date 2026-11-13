import { useState } from "react";
import { Link, useLocation } from "react-router";
import { Menu, X } from "lucide-react";
import { PhoneContact } from "./PhoneContact";

const NAV = [
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
        <Link to="/" className="flex shrink-0 items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden">
            <img
              src="/logo.png"
              alt="Логотип Города Мира"
              className="h-full w-full object-contain"
            />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-2xl font-bold tracking-wide text-white">
              Города <span className="text-[#45c1af]">Мира</span>
            </span>
            <span className="mt-1 text-[10px] uppercase tracking-[0.3em] text-white/50">
              аренда коттеджей
            </span>
          </span>
        </Link>

        <nav className="hidden shrink-0 items-center gap-4 lg:flex xl:gap-6">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`relative whitespace-nowrap text-[11px] uppercase tracking-[0.12em] transition-colors duration-300 after:absolute after:-bottom-2 after:left-0 after:h-px after:bg-[#45c1af] after:transition-all after:duration-300 xl:text-[13px] ${
                location.pathname === item.to
                  ? "text-[#45c1af] after:w-full"
                  : "text-white/70 after:w-0 hover:text-white hover:after:w-full"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-5 lg:flex xl:gap-6">
          <PhoneContact variant="header" />
          <Link
            to="/contacts"
            className="btn-brand hidden !px-5 !py-3.5 text-xs whitespace-nowrap xl:inline-flex"
          >
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
                    ? "text-[#45c1af]"
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
