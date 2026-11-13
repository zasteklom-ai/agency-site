// In-memory rate limiter: Map + TTL. Redis в проекте нет — для одного
// VPS-процесса этого достаточно; при горизонтальном масштабировании
// заменить на @upstash/ratelimit поверх Redis.

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    b = { count: 0, resetAt: now + windowMs };
    buckets.set(key, b);
  }
  b.count += 1;
  if (b.count > limit) {
    return { allowed: false, retryAfterMs: b.resetAt - now };
  }
  return { allowed: true, retryAfterMs: 0 };
}

// Периодическая уборка протухших бакетов, чтобы карта не росла бесконечно
const sweeper = setInterval(() => {
  const now = Date.now();
  for (const [k, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(k);
  }
}, 5 * 60 * 1000);
sweeper.unref();

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
