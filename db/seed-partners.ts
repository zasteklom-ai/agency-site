// Сид партнёрских площадок: заливает исходники из src/data/partners в таблицу
// partners (upsert по slug). Запуск: npm run db:seed-partners
import "dotenv/config";
import { eq } from "drizzle-orm";
import { getDb } from "../api/queries/connection";
import { partners } from "./schema";
import { uOzera } from "../src/data/partners/u-ozera";
import { marinoHall } from "../src/data/partners/marino-hall";
import { splitPartnerInput, partnerInputSchema } from "@contracts/partners";

const SEEDS = [uOzera, marinoHall];

async function main() {
  const db = getDb();

  for (const flat of SEEDS) {
    const input = partnerInputSchema.parse(splitPartnerInput(flat));
    const [existing] = await db
      .select({ id: partners.id })
      .from(partners)
      .where(eq(partners.slug, input.slug));

    if (existing) {
      await db.update(partners).set(input).where(eq(partners.id, existing.id));
      console.log(`[seed-partners] обновлена площадка "${input.slug}" (id=${existing.id})`);
    } else {
      const [result] = await db.insert(partners).values(input);
      console.log(`[seed-partners] добавлена площадка "${input.slug}" (id=${Number(result.insertId)})`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("[seed-partners] ошибка:", e);
    process.exit(1);
  });
