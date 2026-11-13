import { readFileSync } from "fs";
import { join } from "path";
import { getDb } from "../api/queries/connection";
import { cottages, cottagePhotos } from "./schema";
import { eq } from "drizzle-orm";

interface FeedCottage {
  externalId: string;
  title: string;
  description: string | null;
  address: string | null;
  district: string | null;
  lat: number | null;
  lng: number | null;
  bedrooms: number | null;
  beds: number | null;
  totalArea: number | null;
  landArea: number | null;
  price: number | null;
  hasBanya: boolean;
  hasSauna: boolean;
  hasPool: boolean;
  hasKupel: boolean;
  hasBilliard: boolean;
  hasBbq: boolean;
  priceWeekday: number | null;
  priceFriday: number | null;
  priceSaturday: number | null;
  priceWeekend: number | null;
  priceNewyear: number | null;
  deposit: number | null;
  amenities: string | null;
  status: string;
}

interface FeedPhoto {
  id: number;
  cottageId: number; // Это id из cottages.json (не externalId!)
  url: string;
  sortOrder: number;
}

async function main() {
  const db = getDb();

  // 1. Читаем коттеджи
  const cottagesPath = join(process.cwd(), "db", "cottages.json");
  const cottagesData: FeedCottage[] = JSON.parse(readFileSync(cottagesPath, "utf-8"));

  // 2. Читаем фотографии
  const photosPath = join(process.cwd(), "db", "photos.json");
  const photosData: FeedPhoto[] = JSON.parse(readFileSync(photosPath, "utf-8"));

  console.log(`🌱 Начинаем наполнение базы...`);
  console.log(`   Коттеджей: ${cottagesData.length}`);
  console.log(`   Фотографий: ${photosData.length}`);

  // 3. Вставляем коттеджи
  for (const c of cottagesData) {
    await db
      .insert(cottages)
      .values({
        externalId: c.externalId,
        title: c.title || `Дом №${c.externalId}`,
        description: c.description,
        address: c.address,
        district: c.district,
        lat: c.lat,
        lng: c.lng,
        bedrooms: c.bedrooms,
        beds: c.beds,
        totalArea: c.totalArea,
        landArea: c.landArea,
        price: c.price,
        hasBanya: c.hasBanya,
        hasSauna: c.hasSauna,
        hasPool: c.hasPool,
        hasKupel: c.hasKupel,
        hasBilliard: c.hasBilliard,
        hasBbq: c.hasBbq,
        priceWeekday: c.priceWeekday,
        priceFriday: c.priceFriday,
        priceSaturday: c.priceSaturday,
        priceWeekend: c.priceWeekend,
        priceNewyear: c.priceNewyear,
        deposit: c.deposit,
        amenities: c.amenities,
        status: c.status || "active",
      })
      .onDuplicateKeyUpdate({
        set: {
          title: c.title || `Дом №${c.externalId}`,
          description: c.description,
          price: c.price,
          status: c.status || "active",
        },
      });
  }

  // 4. Очищаем старые фотографии
  await db.delete(cottagePhotos);

  // 5. Вставляем фотографии
  // В photos.json cottageId ссылается на id из cottages.json (который становится id в БД)
  for (const p of photosData) {
    await db.insert(cottagePhotos).values({
      cottageId: p.cottageId,
      url: p.url, // Относительный путь вида /photos/1325_0.jpg
      sortOrder: p.sortOrder,
    });
  }

  console.log(`✅ Успешно добавлено/обновлено коттеджей: ${cottagesData.length}`);
  console.log(`✅ Успешно добавлено фотографий: ${photosData.length}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Ошибка при наполнении базы:", err);
  process.exit(1);
});