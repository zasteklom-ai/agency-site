import { useEffect, useRef, useState } from "react";
import { Phone, Send, X } from "lucide-react";
import { CONTACTS } from "@/config";
import { reachGoal } from "@/lib/metrika";

// Иконка MAX (бренд мессенджера)
function MaxIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="10" fill="#7B61FF" />
      <text
        x="12"
        y="15.5"
        textAnchor="middle"
        fontSize="9"
        fontWeight="800"
        fill="#fff"
        fontFamily="Arial, sans-serif"
      >
        M
      </text>
    </svg>
  );
}

// Иконка WhatsApp
function WhatsAppIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#25D366">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.83 9.83 0 0 0 12.04 2zm0 18.03a8.1 8.1 0 0 1-4.13-1.13l-.3-.18-3.12.82.83-3.04-.2-.31a8.08 8.08 0 0 1-1.24-4.28c0-4.47 3.64-8.11 8.12-8.11 2.17 0 4.2.84 5.73 2.38a8.06 8.06 0 0 1 2.38 5.73c0 4.48-3.64 8.12-8.07 8.12zm4.45-6.07c-.24-.12-1.44-.71-1.66-.79-.22-.08-.39-.12-.55.12-.16.24-.63.79-.77.95-.14.16-.28.18-.53.06-.24-.12-1.03-.38-1.96-1.21-.72-.65-1.21-1.44-1.36-1.68-.14-.24-.01-.37.11-.5.11-.11.24-.28.37-.42.12-.14.16-.24.24-.4.08-.16.04-.31-.02-.43-.06-.12-.55-1.32-.75-1.8-.2-.48-.4-.41-.55-.42h-.47c-.16 0-.43.06-.65.31-.22.24-.86.84-.86 2.05 0 1.21.88 2.37 1 2.53.12.16 1.72 2.63 4.18 3.69.58.25 1.04.4 1.4.52.59.19 1.12.16 1.54.1.47-.07 1.44-.59 1.64-1.16.2-.57.2-1.05.14-1.16-.06-.1-.22-.16-.47-.28z" />
    </svg>
  );
}

const CHANNELS = [
  {
    key: "telegram",
    label: "Telegram",
    href: () => CONTACTS.telegram,
    icon: <Send size={22} className="text-[#229ED9]" />,
    external: true,
  },
  {
    key: "max",
    label: "MAX",
    href: () => CONTACTS.max,
    icon: <MaxIcon />,
    external: true,
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    href: () => CONTACTS.whatsapp,
    icon: <WhatsAppIcon />,
    external: true,
  },
  {
    key: "call",
    label: "Позвонить",
    href: () => `tel:${CONTACTS.phoneRaw}`,
    icon: <Phone size={22} className="text-[#34C759]" />,
    external: false,
  },
];

export function PhoneContact({
  variant = "header",
  className = "",
}: {
  variant?: "header" | "footer" | "mobile" | "card";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const textColor =
    variant === "footer"
      ? "text-white/70 hover:text-[#45c1af]"
      : variant === "mobile"
        ? "text-[#45c1af]"
        : variant === "card"
          ? "text-[#1f1f1f] hover:text-[#1f7567]"
          : "text-white hover:text-[#45c1af]";

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center transition-colors ${
          variant === "header" || variant === "card"
            ? "group gap-2.5"
            : "gap-2"
        } ${textColor}`}
        aria-expanded={open}
        aria-label="Связаться с нами"
      >
        {variant === "header" ? (
          <>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#45c1af]/40 text-[#45c1af] transition-all duration-300 group-hover:border-[#45c1af] group-hover:bg-[#45c1af] group-hover:text-[#141414]">
              <Phone size={14} />
            </span>
            <span className="flex flex-col items-start leading-none">
              <span className="mb-1 text-[9px] uppercase tracking-[0.24em] text-white/40 transition-colors duration-300 group-hover:text-[#45c1af]/80">
                Позвоните нам
              </span>
              <span className="whitespace-nowrap text-[15px] font-bold tracking-wide">
                {CONTACTS.phoneDisplay}
              </span>
            </span>
          </>
        ) : variant === "card" ? (
          <>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#1f7567]/40 text-[#1f7567] transition-all duration-300 group-hover:border-[#1f7567] group-hover:bg-[#1f7567] group-hover:text-white">
              <Phone size={14} />
            </span>
            <span className="flex flex-col items-start leading-none">
              <span className="mb-1 text-[9px] uppercase tracking-[0.24em] text-[#1f1f1f]/40 transition-colors duration-300 group-hover:text-[#1f7567]/80">
                Позвоните нам
              </span>
              <span className="whitespace-nowrap text-[15px] font-bold tracking-wide">
                {CONTACTS.phoneDisplay}
              </span>
            </span>
          </>
        ) : (
          <>
            <Phone size={15} />
            <span className="whitespace-nowrap text-sm">
              {CONTACTS.phoneDisplay}
            </span>
          </>
        )}
      </button>

      {open && (
        <div className="absolute left-1/2 top-full z-50 mt-3 -translate-x-1/2">
          <div className="relative rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-black/5">
            <div className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-white" />
            <button
              onClick={() => setOpen(false)}
              className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-black/30 transition-colors hover:text-black/60"
              aria-label="Закрыть"
            >
              <X size={14} />
            </button>
            <p className="mb-3 whitespace-nowrap pr-6 text-center text-[11px] font-semibold uppercase tracking-wider text-black/40">
              Выберите способ связи
            </p>
            <div className="flex items-start gap-4">
              {CHANNELS.map((ch) => (
                <a
                  key={ch.key}
                  href={ch.href()}
                  {...(ch.external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  onClick={() => {
                    setOpen(false);
                    reachGoal(`contact_${ch.key}`);
                  }}
                  className="group flex w-14 flex-col items-center gap-1.5"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eef2f0] transition-all duration-200 group-hover:scale-110 group-hover:bg-[#1f7567]/15 group-hover:shadow-md">
                    {ch.icon}
                  </span>
                  <span className="text-[11px] font-medium text-black/60 group-hover:text-black">
                    {ch.label}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
