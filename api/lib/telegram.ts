import { env } from "./env";
import { log } from "./logger";

// В Telegram шлём HTML с кликабельным телефоном и ссылкой на объект в админке.
// Секреты — только из env; без них заявка всё равно сохраняется в leads,
// просто уведомление не уходит (warning в лог).

export interface TelegramLead {
  propertyTitle: string | null;
  propertyId: number | null;
  name: string;
  phone: string;
  checkIn: Date | null;
  checkOut: Date | null;
  guests: number | null;
  message: string | null;
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function fmtDate(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function buildLeadText(lead: TelegramLead): string {
  const adminUrl =
    env.adminPropertyUrlTemplate && lead.propertyId != null
      ? env.adminPropertyUrlTemplate.replace("{id}", String(lead.propertyId))
      : null;

  const lines = [
    "🏠 <b>Новая заявка</b>",
    `<b>Объект:</b> ${escHtml(lead.propertyTitle ?? "Не указан")}`,
    `<b>Имя:</b> ${escHtml(lead.name)}`,
    `<b>Телефон:</b> <code>${escHtml(lead.phone)}</code>`,
    `<b>Заезд:</b> ${fmtDate(lead.checkIn)}`,
    `<b>Выезд:</b> ${fmtDate(lead.checkOut)}`,
    `<b>Гостей:</b> ${lead.guests ?? "—"}`,
  ];
  if (lead.message) lines.push(`<b>Комментарий:</b> ${escHtml(lead.message)}`);
  if (adminUrl) lines.push(`<a href="${escHtml(adminUrl)}">Открыть в админке</a>`);
  return lines.join("\n");
}

export async function sendTelegramLead(lead: TelegramLead): Promise<boolean> {
  if (!env.telegramBotToken || !env.telegramChatId) {
    log.warn("telegram not configured, lead saved without notification");
    return false;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${env.telegramBotToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: env.telegramChatId,
          parse_mode: "HTML",
          text: buildLeadText(lead),
          disable_web_page_preview: true,
        }),
        signal: controller.signal,
      },
    );
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      log.error("telegram send failed", { status: res.status, body: body.slice(0, 300) });
      return false;
    }
    return true;
  } catch (e) {
    log.error("telegram send error", {
      error: e instanceof Error ? e.message : String(e),
    });
    return false;
  } finally {
    clearTimeout(timer);
  }
}
