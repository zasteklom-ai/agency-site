import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { log } from "./lib/logger";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "goroda-mira-admin";

function extractBearer(req: Request): string | null {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim();
}

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
  // G9: a procedure that throws never reaches app.onError — the tRPC fetch
  // adapter catches it and returns its own 500 JSON, so the Hono error handler
  // is bypassed entirely. That left the most common real failure (a mutation
  // 500ing) with NO structured record in app.log on the server side; it only
  // appeared if the caller happened to log it in its own catch. This hook is the
  // missing server-side safety net. INTERNAL_SERVER_ERROR only: a thrown
  // TRPCError like UNAUTHORIZED is a deliberate business answer, not a crash,
  // and logging those would drown the file.
  errorFormatter({ shape, error }) {
    if (error.code === "INTERNAL_SERVER_ERROR") {
      log.error("trpc procedure failed", {
        path: shape.data?.path,
        code: error.code,
        error: error.message,
        stack: error.stack,
      });
    }
    return shape;
  },
});

export const createRouter = t.router;
export const publicQuery = t.procedure;

// Новые админские процедуры идут через Bearer-токен (тот же ADMIN_TOKEN,
// который админка после логина хранит в sessionStorage), а не через поле
// token в каждом input. Существующие admin.* не трогаем — контракты intact.
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  const token = extractBearer(ctx.req);
  if (!token || token !== ADMIN_TOKEN) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Нет доступа" });
  }
  return next();
});
