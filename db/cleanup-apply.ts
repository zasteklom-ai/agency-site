/**
 * Одноразовая чистка данных коттеджей:
 *  1. cottages.json: описания без HTML, bedrooms пересчитаны deriveBedrooms.
 *  2. БД: те же преобразования применяются in-place к текущим значениям
 *     (админские правки описаний не затираются — чистим то, что в БД).
 * Запуск: npx tsx db/cleanup-apply.ts
 */
import { readFileSync, writeFileSync, copyFileSync, existsSync, unlinkSync } from "fs";
import { join } from "path";
import { eq } from "drizzle-orm";
import { getDb } from "../api/queries/connection";
import { cottages } from "./schema";
import { cleanDescription, deriveBedrooms } from "./cleanup-utils";

const BAK = join(process.cwd(), "db", "cottages.json.bak");

interface JsonCottage {
  id: number;
  externalId: string;
  title: string;
  description: string | null;
  bedrooms: number | null;
  totalArea: number | null;
}

async function main() {
  const db = getDb();

  const path = join(process.cwd(), "db", "cottages.json");
  const data: JsonCottage[] = JSON.parse(readFileSync(path, "utf-8"));

  // --- JSON: чистим и перезаписываем ---
  if (existsSync(BAK)) unlinkSync(BAK);
  copyFileSync(path, BAK);

  let jsonDescChanged = 0;
  let jsonBedChanged = 0;
  for (const c of data) {
    const cleaned = cleanDescription(c.description);
    if (cleaned !== c.description) {
      c.description = cleaned;
      jsonDescChanged++;
    }
    const derived = deriveBedrooms({
      description: c.description,
      title: c.title,
      totalArea: c.totalArea,
    });
    if (derived !== (c.bedrooms ?? null)) {
      c.bedrooms = derived;
      jsonBedChanged++;
    }
  }
  writeFileSync(path, JSON.stringify(data, null, 1), "utf-8");
  console.log(`JSON: описаний очищено ${jsonDescChanged}, bedrooms обновлено ${jsonBedChanged} (бэкап: db/cottages.json.bak)`);

  // --- БД: in-place по текущим значениям строк ---
  const rows = await db.select().from(cottages);
  let dbDescChanged = 0;
  let dbBedChanged = 0;
  const skipped: string[] = [];

  for (const r of rows) {
    // Тестовые ручные записи пропускаем: решение об удалении — за владельцем данных
    if (String(r.externalId).startsWith("manual-")) {
      skipped.push(`id=${r.id} ext=${r.externalId} title=${r.title}`);
      continue;
    }
    const cleaned = cleanDescription(r.description);
    const derived = deriveBedrooms({
      description: cleaned,
      title: r.title,
      totalArea: r.totalArea,
    });
    const descChanged = cleaned !== r.description;
    const bedChanged = derived !== (r.bedrooms ?? null);
    if (descChanged || bedChanged) {
      await db
        .update(cottages)
        .set({
          ...(descChanged ? { description: cleaned } : {}),
          ...(bedChanged ? { bedrooms: derived } : {}),
        })
        .where(eq(cottages.externalId, r.externalId));
      if (descChanged) dbDescChanged++;
      if (bedChanged) dbBedChanged++;
    }
  }
  console.log(`БД: описаний очищено ${dbDescChanged}, bedrooms обновлено ${dbBedChanged}, строк всего ${rows.length}`);
  if (skipped.length) console.log("Пропущено (manual-):", skipped.join(" | "));

  // --- Верификация ---
  const after = await db.select().from(cottages);
  const htmlLeft = after.filter((r) => r.description && /<\/?[a-zA-Z]/.test(r.description));
  const absurd = after.filter(
    (r) => r.bedrooms != null && (r.bedrooms < 1 || r.bedrooms > 20),
  );
  console.log(`Верификация: строк с HTML после чистки: ${htmlLeft.length}, bedrooms вне 1..20: ${absurd.length}`);
  if (htmlLeft.length) console.log("  HTML остался:", htmlLeft.map((r) => r.id).join(","));

  process.exit(0);
}

main().catch((e) => {
  console.error("❌ Ошибка чистки:", e);
  process.exit(1);
});
