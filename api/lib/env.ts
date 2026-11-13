import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? "";
}

export const env = {
  appId: required("APP_ID"),
  appSecret: required("APP_SECRET"),
  isProduction: process.env.NODE_ENV === "production",
  databaseUrl: required("DATABASE_URL"),
  // Не обязательны для старта: без них молча отключаются Telegram и абсолютные URL.
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
  telegramChatId: process.env.TELEGRAM_CHAT_ID ?? "",
  siteUrl: (process.env.SITE_URL ?? "").replace(/\/+$/, ""),
  adminPropertyUrlTemplate:
    process.env.ADMIN_PROPERTY_URL_TEMPLATE ?? "",
};

// Абсолютный URL сайта: из env, иначе — origin текущего запроса.
export function resolveSiteUrl(req: Request): string {
  if (env.siteUrl) return env.siteUrl;
  return new URL(req.url).origin;
}
